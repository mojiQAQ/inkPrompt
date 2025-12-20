"""
Database migration script for Sprint 3-4
Adds indexes to prompts and tags tables for better search performance
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy import text
from app.core.database import engine


def migrate():
    """Run migration for Sprint 3-4"""
    print("🔧 Running Sprint 3-4 database migration...")

    with engine.connect() as connection:
        # Check if we're using SQLite
        dialect = engine.dialect.name
        print(f"Database dialect: {dialect}")

        # For prompts table
        print("📦 Adding indexes to prompts table...")
        try:
            # Add index on name field
            connection.execute(text("CREATE INDEX IF NOT EXISTS idx_prompts_name ON prompts(name)"))
            print("✅ Index on prompts.name created")
        except Exception as e:
            print(f"ℹ️  prompts.name index may already exist: {e}")

        try:
            # Add index on content field (first 100 chars for SQLite)
            if dialect == "sqlite":
                connection.execute(text("CREATE INDEX IF NOT EXISTS idx_prompts_content ON prompts(content)"))
            else:
                # For PostgreSQL, we can use GIN or GiST index for full-text search
                connection.execute(text("CREATE INDEX IF NOT EXISTS idx_prompts_content ON prompts USING gin(to_tsvector('english', content))"))
            print("✅ Index on prompts.content created")
        except Exception as e:
            print(f"ℹ️  prompts.content index may already exist: {e}")

        # For tags table
        print("📦 Adding index to tags table...")
        try:
            # Add index on name field (already has unique constraint but good for search)
            connection.execute(text("CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name)"))
            print("✅ Index on tags.name created")
        except Exception as e:
            print(f"ℹ️  tags.name index may already exist: {e}")

        connection.commit()

    print("✅ Migration completed successfully!")


if __name__ == "__main__":
    migrate()
