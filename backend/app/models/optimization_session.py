"""Models for prompt optimization sessions."""
from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class OptimizationSession(Base):
    """Persistent optimization session bound to a prompt."""

    __tablename__ = "optimization_sessions"

    id = Column(String(36), primary_key=True, index=True)
    prompt_id = Column(String(36), ForeignKey("prompts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    prompt = relationship("Prompt", back_populates="optimization_sessions")
    user = relationship("User", back_populates="optimization_sessions")
    rounds = relationship(
        "OptimizationRound",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="OptimizationRound.round_number",
    )


class OptimizationRound(Base):
    """Single optimization round inside a session."""

    __tablename__ = "optimization_rounds"

    id = Column(String(36), primary_key=True, index=True)
    session_id = Column(String(36), ForeignKey("optimization_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    round_number = Column(Integer, nullable=False)
    user_idea = Column(Text, nullable=True)
    selected_suggestions = Column(JSON, nullable=True)
    optimized_content = Column(Text, nullable=False)
    suggestions = Column(JSON, nullable=False, default=list)
    domain_analysis = Column(Text, nullable=False, default="")
    version_id = Column(String(36), ForeignKey("prompt_versions.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    session = relationship("OptimizationSession", back_populates="rounds")
    version = relationship("PromptVersion", back_populates="optimization_rounds")
