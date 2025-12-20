"""
Database initialization script

This script initializes the database by:
1. Creating all tables
2. Initializing system preset tags
"""
import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.append(str(Path(__file__).parent.parent))

from app.core.database import engine, SessionLocal, Base
from app.utils.init_data import init_system_tags


def init_db():
    """Initialize database"""
    print("🔧 Initializing database...")

    # Create all tables
    print("📦 Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully")

    # Initialize system tags
    print("🏷️  Initializing system preset tags...")
    db = SessionLocal()
    try:
        count = init_system_tags(db)
        if count > 0:
            print(f"✅ Successfully initialized {count} system tags")
        else:
            print("ℹ️  System tags already initialized")
    finally:
        db.close()

    print("🎉 Database initialization complete!")


if __name__ == "__main__":
    init_db()
