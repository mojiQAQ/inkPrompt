"""Prompt square related models."""
import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class PromptSquareEntry(Base):
    """Public prompt square entry."""

    __tablename__ = "prompt_square_entries"

    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    prompt_id = Column(String(36), ForeignKey("prompts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    title = Column(String(255), nullable=False)
    summary = Column(String(500), nullable=False)
    category = Column(String(50), nullable=False, index=True)
    difficulty = Column(String(20), default="simple", nullable=False, index=True)
    recommended_models = Column(Text, nullable=True)
    content_snapshot = Column(Text, nullable=False)
    allow_full_preview = Column(Boolean, default=False, nullable=False)

    status = Column(String(20), default="published", nullable=False, index=True)
    moderation_status = Column(String(20), default="approved", nullable=False, index=True)

    views = Column(Integer, default=0, nullable=False)
    likes = Column(Integer, default=0, nullable=False)
    favorites = Column(Integer, default=0, nullable=False)
    copies = Column(Integer, default=0, nullable=False)

    published_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    prompt = relationship("Prompt")
    user = relationship("User")

    __table_args__ = (
        UniqueConstraint("prompt_id", name="uix_prompt_square_entry_prompt"),
    )


class PromptSquareLike(Base):
    """Prompt square like records."""

    __tablename__ = "prompt_square_likes"

    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    entry_id = Column(String(36), ForeignKey("prompt_square_entries.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("entry_id", "user_id", name="uix_square_like_entry_user"),
    )


class PromptSquareFavorite(Base):
    """Prompt square favorite records."""

    __tablename__ = "prompt_square_favorites"

    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    entry_id = Column(String(36), ForeignKey("prompt_square_entries.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("entry_id", "user_id", name="uix_square_favorite_entry_user"),
    )


class PromptSquareCopyLog(Base):
    """Prompt square copy logs."""

    __tablename__ = "prompt_square_copy_logs"

    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    entry_id = Column(String(36), ForeignKey("prompt_square_entries.id", ondelete="CASCADE"), nullable=False, index=True)
    source_prompt_id = Column(String(36), ForeignKey("prompts.id", ondelete="SET NULL"), nullable=True)
    target_prompt_id = Column(String(36), ForeignKey("prompts.id", ondelete="SET NULL"), nullable=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
