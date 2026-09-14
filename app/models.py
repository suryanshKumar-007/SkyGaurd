"""
Database tables. Deliberately minimal for the prototype:
Station -> has many Readings -> some Readings trigger an Anomaly.
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class Station(Base):
    __tablename__ = "stations"

    id = Column(Integer, primary_key=True, index=True)
    station_code = Column(String, unique=True, index=True)  # e.g. "AWS_01"
    name = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)

    readings = relationship("Reading", back_populates="station")
    anomalies = relationship("Anomaly", back_populates="station")


class Reading(Base):
    __tablename__ = "readings"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("stations.id"))
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    temperature = Column(Float)   # deg C
    pressure = Column(Float)      # hPa
    humidity = Column(Float)      # %

    is_injected = Column(Boolean, default=False)  # true if we manually injected a fault

    station = relationship("Station", back_populates="readings")


class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("stations.id"))
    reading_id = Column(Integer, ForeignKey("readings.id"))
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    sensor = Column(String)         # "temperature" | "pressure" | "humidity"
    anomaly_type = Column(String)   # "spike" | "frozen" | "drift" | "noise" | "range"
    verdict = Column(String)        # "FAULT" | "GENUINE_EXTREME" | "UNCERTAIN"
    confidence = Column(Float)
    severity = Column(String)       # "low" | "medium" | "high"
    rule_fired = Column(String)     # which check triggered it
    raw_value = Column(Float)

    station = relationship("Station", back_populates="anomalies")