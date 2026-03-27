"""Database configuration and session management."""
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

from app.core.config import get_settings

settings = get_settings()

# Create SQLAlchemy engine
engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {},
    echo=settings.debug,
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    Dependency function that yields database sessions.

    Usage:
        @app.get("/items")
        def read_items(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Initialize database by creating all tables."""
    Base.metadata.create_all(bind=engine)
    _ensure_prompt_square_source_columns()


def _ensure_prompt_square_source_columns() -> None:
    """Backfill columns for SQLite/local environments without migrations."""
    inspector = inspect(engine)
    if "prompts" not in inspector.get_table_names():
        return

    existing_columns = {column["name"] for column in inspector.get_columns("prompts")}
    statements = []

    if "source_square_entry_id" not in existing_columns:
        statements.append("ALTER TABLE prompts ADD COLUMN source_square_entry_id VARCHAR(36)")

    if "source_square_title" not in existing_columns:
        statements.append("ALTER TABLE prompts ADD COLUMN source_square_title VARCHAR(255)")

    if not statements:
        return

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))

        if "sqlite" in settings.database_url:
            connection.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS ix_prompts_source_square_entry_id "
                    "ON prompts (source_square_entry_id)"
                )
            )
