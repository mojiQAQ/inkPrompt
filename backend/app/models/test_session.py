"""Models for prompt test sessions."""
from sqlalchemy import Column, DateTime, ForeignKey, JSON, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class TestSession(Base):
    """Persistent test session bound to a prompt version."""

    __tablename__ = "test_sessions"

    id = Column(String(36), primary_key=True, index=True)
    prompt_version_id = Column(String(36), ForeignKey("prompt_versions.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    prompt_version = relationship("PromptVersion", back_populates="test_sessions")
    user = relationship("User", back_populates="test_sessions")
    conversations = relationship(
        "TestModelConversation",
        back_populates="test_session",
        cascade="all, delete-orphan",
        order_by="TestModelConversation.created_at",
    )


class TestModelConversation(Base):
    """Conversation history for a single selected model."""

    __tablename__ = "test_model_conversations"

    id = Column(String(36), primary_key=True, index=True)
    test_session_id = Column(String(36), ForeignKey("test_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    model_name = Column(String(255), nullable=False)
    model_config = Column(JSON, nullable=False, default=dict)
    messages = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    test_session = relationship("TestSession", back_populates="conversations")
