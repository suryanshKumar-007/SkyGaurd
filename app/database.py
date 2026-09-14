"""
Database connection setup.
Uses SQLite for the prototype -- zero setup, single file (aws.db).
Swap SQLALCHEMY_DATABASE_URL to postgresql://... later if needed, nothing
else in the app changes.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

SQLALCHEMY_DATABASE_URL = "sqlite:///./aws.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency: yields a DB session, closes it after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()