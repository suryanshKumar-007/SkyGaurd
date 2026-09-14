"""
Run this once to create the DB and fill it with a few stations + a clean,
physically-plausible history for each -- so the Isolation Forest has
something to learn from before you start injecting faults live.

Later: replace generate_clean_series() with a real CSV loader (e.g. NOAA
ISD data) -- everything downstream (models, ml.py, API) stays the same.
"""
import numpy as np
from datetime import datetime, timedelta
from .database import Base, engine, SessionLocal
# pyrefly: ignore [missing-import]
from .models import Station, Reading

STATIONS = [
    {"station_code": "AWS_01", "name": "Rohtak", "latitude": 28.90, "longitude": 76.61},
    {"station_code": "AWS_02", "name": "Hisar", "latitude": 29.15, "longitude": 75.72},
    {"station_code": "AWS_03", "name": "Panipat", "latitude": 29.39, "longitude": 76.97},
]


def generate_clean_series(n_points=150, seed=0):
    """A gentle daily sine wave + small noise -- stands in for real weather."""
    rng = np.random.default_rng(seed)
    t = np.arange(n_points)
    temperature = 28 + 6 * np.sin(2 * np.pi * t / 48) + rng.normal(0, 0.5, n_points)
    pressure = 1008 + 3 * np.sin(2 * np.pi * t / 96) + rng.normal(0, 0.3, n_points)
    humidity = 55 - 15 * np.sin(2 * np.pi * t / 48) + rng.normal(0, 2, n_points)
    humidity = np.clip(humidity, 10, 95)
    return temperature, pressure, humidity


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    if db.query(Station).count() > 0:
        print("Already seeded -- delete aws.db if you want to start fresh.")
        db.close()
        return

    now = datetime.utcnow()
    for i, s in enumerate(STATIONS):
        station = Station(**s)
        db.add(station)
        db.commit()
        db.refresh(station)

        temperature, pressure, humidity = generate_clean_series(seed=i)
        for j in range(len(temperature)):
            reading = Reading(
                station_id=station.id,
                timestamp=now - timedelta(minutes=(len(temperature) - j) * 5),
                temperature=float(temperature[j]),
                pressure=float(pressure[j]),
                humidity=float(humidity[j]),
            )
            db.add(reading)
        db.commit()
        print(f"Seeded {station.station_code} with {len(temperature)} readings.")

    db.close()


if __name__ == "__main__":
    seed()