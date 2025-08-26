"""Database connection and session management."""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from typing import Generator

from sentinel.config import settings

# Create database engine
engine = create_engine(
    settings.database.url,
    poolclass=None,
    pool_pre_ping=True,
    echo=settings.api.debug
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """Dependency to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Create all database tables."""
    from sentinel.storage.models import Base
    Base.metadata.create_all(bind=engine)


def drop_tables():
    """Drop all database tables."""
    from sentinel.storage.models import Base
    Base.metadata.drop_all(bind=engine)
