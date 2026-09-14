"""
Anomaly detection logic. Two tiers, kept simple on purpose:

Tier 1 - deterministic rule checks (range, step/spike, frozen/persistence).
  These run on every single reading, instantly, no training needed.
  Confidence scores scale with the severity of the violation rather than
  being fixed constants.

Tier 2 - Isolation Forest, trained per-station on a rolling history buffer,
  used for the "does this reading fit the joint T-P-H pattern this
  station usually shows" check.
  The model is CACHED per station and only retrained every
  MODEL_RETRAIN_INTERVAL new readings -- not on every single incoming
  reading -- to balance freshness vs. CPU cost.

detect_anomaly() is the ONE function the backend calls. It returns None if
the reading looks normal, or a dict describing the anomaly if not.
Keep this function's signature stable -- it's the contract between the
"ML person" and the "backend person" on your team.
"""
from collections import deque, defaultdict
from sklearn.ensemble import IsolationForest
import numpy as np

# ---- Tier 1: physically-reasonable hard ranges (tune for your demo data) ----
RANGES = {
    "temperature": (-10, 55),   # deg C
    "pressure": (850, 1085),    # hPa (station-level pressure, sea-level would differ)
    "humidity": (0, 100),       # %
}

# how much a value is allowed to jump between two consecutive readings
MAX_STEP = {
    "temperature": 5.0,   # deg C per reading interval
    "pressure": 6.0,      # hPa per reading interval
    "humidity": 15.0,     # % per reading interval
}

# how many identical consecutive values before we call it "frozen"
FROZEN_WINDOW = 5

# ---- Tier 2: Isolation Forest config ----
# Minimum history points before ML detection is attempted
IF_MIN_HISTORY = 30

# Retrain the cached model whenever history has grown by this many readings
# since the last training.  Balances freshness vs. CPU cost.
MODEL_RETRAIN_INTERVAL = 20

# rolling history per station, used for step-check, frozen-check, and IF training
_history = defaultdict(lambda: deque(maxlen=200))

# per-station model cache: station_code -> {"model": IsolationForest, "trained_on": int}
_model_cache: dict = {}


def preload_history(station_code: str, past_readings: list):
    """Call this once at startup per station, passing its recent readings
    from the DB (oldest first) -- otherwise the very first live reading
    after a server restart has no history to compare against, and Tier-1
    step/frozen checks silently do nothing until enough new data arrives."""
    for r in past_readings:
        _history[station_code].append({
            "temperature": r.temperature,
            "pressure": r.pressure,
            "humidity": r.humidity,
        })


# ---------------------------------------------------------------------------
# Tier 1 checks
# ---------------------------------------------------------------------------

def _check_range(sensor, value):
    lo, hi = RANGES[sensor]
    span = hi - lo
    if value < lo:
        # Confidence scales with how far below the lower bound the value is
        violation_ratio = (lo - value) / span
        confidence = round(min(0.99, 0.80 + violation_ratio * 0.19), 2)
        return {
            "anomaly_type": "range",
            "rule_fired": "range_check",
            "severity": "high",
            "confidence": confidence,
        }
    if value > hi:
        violation_ratio = (value - hi) / span
        confidence = round(min(0.99, 0.80 + violation_ratio * 0.19), 2)
        return {
            "anomaly_type": "range",
            "rule_fired": "range_check",
            "severity": "high",
            "confidence": confidence,
        }
    return None


def _check_step(sensor, value, history):
    if len(history) < 1:
        return None
    last_value = history[-1][sensor]
    delta = abs(value - last_value)
    if delta > MAX_STEP[sensor]:
        # Confidence scales with how much the step exceeds the configured maximum.
        # At exactly 1× the threshold → 0.70; at 3× threshold → ~0.99.
        ratio = delta / MAX_STEP[sensor]
        confidence = round(min(0.99, 0.70 + (ratio - 1.0) * 0.15), 2)
        return {
            "anomaly_type": "spike",
            "rule_fired": "step_check",
            "severity": "high",
            "confidence": confidence,
        }
    return None


def _check_frozen(sensor, value, history):
    if len(history) < FROZEN_WINDOW:
        return None
    recent = [h[sensor] for h in list(history)[-FROZEN_WINDOW:]]
    if all(abs(v - value) < 1e-6 for v in recent):
        return {
            "anomaly_type": "frozen",
            "rule_fired": "persistence_check",
            "severity": "medium",
            "confidence": 0.80,
        }
    return None


# ---------------------------------------------------------------------------
# Tier 2: Isolation Forest with per-station model cache
# ---------------------------------------------------------------------------

def _get_or_train_model(station_code: str, history) -> IsolationForest | None:
    """Return a cached IsolationForest for this station, retraining if needed.

    The model is retrained when:
      - No model exists yet (first time we have enough history), OR
      - The history has grown by MODEL_RETRAIN_INTERVAL readings since the
        last training (keeps the model reasonably up-to-date without paying
        the full training cost on every single incoming reading).
    """
    history_len = len(history)
    if history_len < IF_MIN_HISTORY:
        return None

    cache = _model_cache.get(station_code)
    if cache is None or (history_len - cache["trained_on"]) >= MODEL_RETRAIN_INTERVAL:
        X_train = np.array([
            [h["temperature"], h["pressure"], h["humidity"]]
            for h in history
        ])
        model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
        model.fit(X_train)
        _model_cache[station_code] = {"model": model, "trained_on": history_len}
        cache = _model_cache[station_code]

    return cache["model"]


def _check_isolation_forest(station_code, temperature, pressure, humidity, history):
    """Multivariate check: does (T, P, H) jointly look like an outlier
    compared to this station's own recent history?

    Uses a cached model that is only retrained every MODEL_RETRAIN_INTERVAL
    new readings, not on every single incoming reading.
    """
    model = _get_or_train_model(station_code, history)
    if model is None:
        return None  # not enough history yet to make a meaningful judgment

    X_new = np.array([[temperature, pressure, humidity]])
    score = model.decision_function(X_new)[0]   # higher = more normal
    is_outlier = model.predict(X_new)[0] == -1

    if is_outlier:
        # Map decision score to confidence: more negative score → more anomalous
        confidence = round(float(min(0.99, max(0.50, 0.5 - score))), 2)
        return {
            "anomaly_type": "drift",   # multivariate outlier not caught by simple rules
            "rule_fired": "isolation_forest",
            "severity": "medium",
            "confidence": confidence,
        }
    return None


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def detect_anomaly(station_code: str, temperature: float, pressure: float, humidity: float):
    """
    Main entry point. Call this once per incoming reading.
    Returns None if normal, otherwise a dict:
        {sensor, anomaly_type, rule_fired, severity, confidence, verdict, raw_value}
    """
    history = _history[station_code]
    reading = {"temperature": temperature, "pressure": pressure, "humidity": humidity}

    result = None
    triggered_sensor = None

    for sensor, value in reading.items():
        r = (
            _check_range(sensor, value)
            or _check_step(sensor, value, history)
            or _check_frozen(sensor, value, history)
        )
        if r:
            result = r
            triggered_sensor = sensor
            break  # Tier 1 hit -- no need to run the ML check too

    if result is None:
        # Tier 2: multivariate check across all three sensors together
        r = _check_isolation_forest(station_code, temperature, pressure, humidity, history)
        if r:
            result = r
            triggered_sensor = "temperature+pressure+humidity"

    # Always push this reading into history AFTER checking against it to
    # avoid training/prediction leakage.
    history.append(reading)

    if result is None:
        return None

    # NOTE: this is where a future spatial/physics cross-check would plug in
    # to decide FAULT vs GENUINE_EXTREME (e.g. verify against neighboring stations
    # to distinguish "broken sensor" from "genuine extreme weather event").
    # For the prototype we default all detected anomalies to FAULT.
    result["verdict"] = "FAULT"
    result["sensor"] = triggered_sensor
    # For multivariate IF detection triggered_sensor is the composite string
    # "temperature+pressure+humidity" which is not a key in reading -- fall
    # back to temperature as the most meaningful representative value.
    if triggered_sensor and "+" in triggered_sensor:
        result["raw_value"] = reading.get("temperature")
    else:
        result["raw_value"] = reading.get(triggered_sensor)
    return result