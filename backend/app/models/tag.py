"""Tag model."""
import uuid

from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Table
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


# Association table for many-to-many relationship between Prompt and Tag
prompt_tags = Table(
    "prompt_tags",
    Base.metadata,
    Column("prompt_id", String(36), ForeignKey("prompts.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", String(36), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
    Column("created_at", DateTime(timezone=True), server_default=func.now(), nullable=False),
)


class Tag(Base):
    """Tag model - stores both system and user-defined tags."""

    __tablename__ = "tags"

    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    name = Column(String(50), nullable=False, index=True)
    is_system = Column(Boolean, default=False, nullable=False)
    use_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="tags")
    prompts = relationship("Prompt", secondary=prompt_tags, back_populates="tags")

    def __repr__(self) -> str:
        tag_type = "system" if self.is_system else "user"
        return f"<Tag(id={self.id}, name={self.name}, type={tag_type})>"
