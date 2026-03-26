"""Prompt version model."""
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class PromptVersion(Base):
    """PromptVersion model - stores version history of prompts."""

    __tablename__ = "prompt_versions"

    id = Column(String(36), primary_key=True, index=True)
    prompt_id = Column(String(36), ForeignKey("prompts.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    token_count = Column(Integer, default=0, nullable=False)
    change_note = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    prompt = relationship("Prompt", back_populates="versions")
    test_sessions = relationship("TestSession", back_populates="prompt_version", cascade="all, delete-orphan")
    optimization_rounds = relationship("OptimizationRound", back_populates="version")

    def __repr__(self) -> str:
        return f"<PromptVersion(id={self.id}, prompt_id={self.prompt_id}, version={self.version_number})>"
