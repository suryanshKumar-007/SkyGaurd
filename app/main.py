"""
FastAPI app -- the API contract your frontend will talk to.

Run with:  uvicorn app.main:app --reload
Docs at:   http://127.0.0.1:8000/docs   (auto-generated, test everything here first)
"""
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
import random

from .database import Base, engine, get_db, SessionLocal
from . import models
from .ml import detect_anomaly, preload_history, _history as ml_history

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SkyGuard AI — Intelligent AWS Anomaly Detection API")


@app.on_event("startup")
def load_ml_history_on_startup():
    """Warm up the ML module's in-memory history from whatever is already
    in the DB, so step/frozen checks work correctly from the very first
    live reading, not just after 5-30 new readings accumulate."""
    db = SessionLocal()
    stations = db.query(models.Station).all()
    for s in stations:
        past = (
            db.query(models.Reading)
            .filter(models.Reading.station_id == s.id)
            .order_by(models.Reading.timestamp.asc())
            .limit(200)
            .all()
        )
        preload_history(s.station_code, past)
    db.close()


# allow the React dev server to call this API without CORS errors
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/stations")
def list_stations(db: Session = Depends(get_db)):
    """Fleet overview: every station + its latest reading + current health status.

    Station status:
      GREEN — the most recent reading did not trigger a FAULT anomaly.
      RED   — the most recent reading triggered a FAULT anomaly.

    Critically, injecting a 'normal' reading clears the RED status because
    clean readings produce no anomaly record linked to their reading_id.
    """
    stations = db.query(models.Station).all()
    result = []
    for s in stations:
        latest = (
            db.query(models.Reading)
            .filter(models.Reading.station_id == s.id)
            .order_by(models.Reading.timestamp.desc())
            .first()
        )

        # A station is RED only if its MOST RECENT reading is itself linked
        # to a FAULT anomaly.  A subsequent clean reading clears the status
        # to GREEN even if older FAULT anomaly records exist.
        if latest:
            linked_fault = (
                db.query(models.Anomaly)
                .filter(
                    models.Anomaly.reading_id == latest.id,
                    models.Anomaly.verdict == "FAULT",
                )
                .first()
            )
            status = "red" if linked_fault else "green"
        else:
            status = "green"

        result.append({
            "id": s.id,
            "station_code": s.station_code,
            "name": s.name,
            "latitude": s.latitude,
            "longitude": s.longitude,
            "status": status,
            "latest_reading": {
                "temperature": latest.temperature,
                "pressure": latest.pressure,
                "humidity": latest.humidity,
                "timestamp": latest.timestamp,
            } if latest else None,
        })
    return result


@app.get("/stations/{station_id}/readings")
def get_readings(station_id: int, limit: int = 100, db: Session = Depends(get_db)):
    """Recent readings for the trend chart on the station detail page."""
    station = db.query(models.Station).filter(models.Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")

    readings = (
        db.query(models.Reading)
        .filter(models.Reading.station_id == station_id)
        .order_by(models.Reading.timestamp.desc())
        .limit(limit)
        .all()
    )
    return list(reversed(readings))  # oldest -> newest, easier to plot


@app.get("/stations/{station_id}/anomalies")
def get_anomalies(station_id: int, db: Session = Depends(get_db)):
    """Anomaly history for the timeline view."""
    station = db.query(models.Station).filter(models.Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")

    return (
        db.query(models.Anomaly)
        .filter(models.Anomaly.station_id == station_id)
        .order_by(models.Anomaly.timestamp.desc())
        .all()
    )


@app.get("/alerts")
def get_alerts(limit: int = 20, db: Session = Depends(get_db)):
    """Fleet-wide alerts panel -- every FAULT verdict, most recent first.
    Enriched with station name and code so the frontend doesn't need a
    separate lookup per alert.  Use the `limit` query param to control
    how many alerts are returned (default 20).
    """
    anomalies = (
        db.query(models.Anomaly)
        .filter(models.Anomaly.verdict == "FAULT")
        .order_by(models.Anomaly.timestamp.desc())
        .limit(limit)
        .all()
    )

    # Build a small station lookup to avoid N+1 queries
    station_ids = {a.station_id for a in anomalies}
    stations = {
        s.id: s
        for s in db.query(models.Station).filter(models.Station.id.in_(station_ids)).all()
    }

    result = []
    for a in anomalies:
        s = stations.get(a.station_id)
        result.append({
            "id": a.id,
            "station_id": a.station_id,
            "station_name": s.name if s else f"Station #{a.station_id}",
            "station_code": s.station_code if s else "",
            "sensor": a.sensor,
            "anomaly_type": a.anomaly_type,
            "verdict": a.verdict,
            "confidence": a.confidence,
            "severity": a.severity,
            "rule_fired": a.rule_fired,
            "raw_value": a.raw_value,
            "timestamp": a.timestamp,
        })
    return result


# ---------------------------------------------------------------------------
# Internal ingestion function
# ---------------------------------------------------------------------------
#
# _ingest_reading() is the INGESTION BOUNDARY for this prototype.
# In a future production system, replace or supplement the callers below
# with real data sources such as:
#   - MQTT subscriber (IoT sensors)
#   - Serial/COM port reader (local AWS hardware)
#   - CSV/file watcher (batch import)
#   - IoT gateway webhook
#
# The detection pipeline (detect_anomaly) and storage logic stay the same
# regardless of the data source -- only the ingestion caller changes.
# ---------------------------------------------------------------------------

# Fixed reference point matching seed_data.py's generate_clean_series() center
# values. Faults are computed FROM this baseline, never from "whatever the
# last reading was" -- otherwise repeated clicks compound on top of an
# already-faulty value and runaway (e.g. spike -> spike -> spike -> 300 degC).
BASELINE = {"temperature": 28.0, "pressure": 1008.0, "humidity": 55.0}

# how many times "drift" has been triggered per station since the last reset,
# so each click nudges the value a bounded step further instead of restarting
# from an already-drifted reading.
_drift_steps: dict = {}

# tracks how many injected readings have been pushed into the ML in-memory
# history since the last "normal" reset.  Used by the Normal handler to pop
# exactly that many entries before ingesting the clean baseline, so the
# step-check never compares the reset value against a prior spike/drift value.
_injected_since_reset: dict = {}


def _ingest_reading(db: Session, station_id: int, temperature: float, pressure: float, humidity: float):
    """Shared ingestion logic: save a reading, run it through detect_anomaly,
    save the anomaly if one is detected.

    This is the ingestion boundary -- see comment block above for future
    extension points.
    """
    station = db.query(models.Station).filter(models.Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")

    reading = models.Reading(
        station_id=station_id,
        timestamp=datetime.utcnow(),
        temperature=temperature,
        pressure=pressure,
        humidity=humidity,
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)

    result = detect_anomaly(station.station_code, temperature, pressure, humidity)
    if result:
        anomaly = models.Anomaly(
            station_id=station_id,
            reading_id=reading.id,
            timestamp=datetime.utcnow(),
            sensor=result["sensor"],
            anomaly_type=result["anomaly_type"],
            verdict=result["verdict"],
            confidence=result["confidence"],
            severity=result["severity"],
            rule_fired=result["rule_fired"],
            raw_value=result["raw_value"],
        )
        db.add(anomaly)
        db.commit()

    return reading, result


@app.post("/simulate/inject")
def simulate_inject(station_id: int, fault_type: str, db: Session = Depends(get_db)):
    """
    THE DEMO BUTTON. Call this during your presentation to trigger a live
    fault in front of the judges, e.g.:
        POST /simulate/inject?station_id=1&fault_type=spike
    fault_type: "spike" | "frozen" | "drift" | "normal"

    IMPORTANT: spike/drift/normal are computed from a fixed BASELINE, not
    from the last reading -- this is intentional so that clicking the same
    button multiple times (or the frontend's retry loop) never compounds
    into an unrealistic runaway value. "frozen" is the one exception: it
    deliberately repeats the last real reading, because that IS what a
    stuck sensor looks like.
    """
    # Validate fault_type early to give a clean error rather than silently
    # doing nothing.
    valid_fault_types = {"spike", "frozen", "drift", "normal"}
    if fault_type not in valid_fault_types:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid fault_type '{fault_type}'. Must be one of: {sorted(valid_fault_types)}",
        )

    last = (
        db.query(models.Reading)
        .filter(models.Reading.station_id == station_id)
        .order_by(models.Reading.timestamp.desc())
        .first()
    )
    base_t = last.temperature if last else BASELINE["temperature"]
    base_p = last.pressure if last else BASELINE["pressure"]
    base_h = last.humidity if last else BASELINE["humidity"]

    if fault_type == "spike":
        # Single one-off reading far above baseline -- triggers step/range check
        temperature = BASELINE["temperature"] + 20  # +20°C from baseline
        pressure, humidity = BASELINE["pressure"], BASELINE["humidity"]
        _drift_steps[station_id] = 0  # a fresh fault resets any prior drift count
        _injected_since_reset[station_id] = _injected_since_reset.get(station_id, 0) + 1

    elif fault_type == "frozen":
        # Repeat the last real reading exactly -- triggers persistence check after
        # FROZEN_WINDOW consecutive identical values
        temperature, pressure, humidity = base_t, base_p, base_h
        _injected_since_reset[station_id] = _injected_since_reset.get(station_id, 0) + 1

    elif fault_type == "drift":
        # Each click nudges temperature +3°C from baseline (well below the 5°C
        # step-check threshold so Tier 1 misses it), capped at +15°C so the
        # value doesn't run away.  Designed to be caught by Isolation Forest.
        _drift_steps[station_id] = _drift_steps.get(station_id, 0) + 1
        step = min(_drift_steps[station_id], 5)
        temperature = BASELINE["temperature"] + step * 3
        pressure, humidity = BASELINE["pressure"], BASELINE["humidity"]
        _injected_since_reset[station_id] = _injected_since_reset.get(station_id, 0) + 1

    else:  # "normal" -- explicit reset back to baseline
        _drift_steps[station_id] = 0
        temperature = BASELINE["temperature"] + random.uniform(-0.5, 0.5)
        pressure = BASELINE["pressure"] + random.uniform(-0.3, 0.3)
        humidity = BASELINE["humidity"] + random.uniform(-1, 1)
        # Pop ALL injected readings from the ML in-memory history before
        # ingesting the reset value.  This ensures the step-check compares the
        # clean ~28°C baseline against the last GENUINE clean reading, not
        # against a spike (48°C) or the tail of a drift sequence (43°C).
        # A single pop() was insufficient -- after 5 drift readings the history
        # still had 40°C as the penultimate entry, causing a spurious spike alarm.
        n_to_pop = _injected_since_reset.get(station_id, 0)
        station_obj = db.query(models.Station).filter(models.Station.id == station_id).first()
        if station_obj and n_to_pop > 0:
            hist = ml_history[station_obj.station_code]
            for _ in range(min(n_to_pop, len(hist))):
                hist.pop()
        _injected_since_reset[station_id] = 0

    reading, result = _ingest_reading(db, station_id, temperature, pressure, humidity)
    return {"reading_id": reading.id, "anomaly_detected": result}