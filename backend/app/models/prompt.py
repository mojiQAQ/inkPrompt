"""Prompt model."""
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.tag import prompt_tags


class Prompt(Base):
    """Prompt model - stores user prompts."""

    __tablename__ = "prompts"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    token_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="prompts")
    versions = relationship("PromptVersion", back_populates="prompt", cascade="all, delete-orphan", order_by="PromptVersion.version_number")
    tags = relationship("Tag", secondary=prompt_tags, back_populates="prompts")

    @property
    def version_count(self) -> int:
        """Get the number of versions for this prompt."""
        return len(self.versions) if self.versions else 0

    def __repr__(self) -> str:
        return f"<Prompt(id={self.id}, name={self.name}, user_id={self.user_id})>"
