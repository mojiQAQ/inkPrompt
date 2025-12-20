"""Model call tracking model."""
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, Enum, Numeric, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class CallStatus(str, enum.Enum):
    """Call status enumeration."""
    SUCCESS = "success"
    FAILURE = "failure"
    TIMEOUT = "timeout"


class CompletionReason(str, enum.Enum):
    """Completion reason enumeration."""
    STOP = "stop"
    LENGTH = "length"
    ERROR = "error"
    TIMEOUT = "timeout"


class ModelCall(Base):
    """ModelCall model - stores LLM API call history."""

    __tablename__ = "model_calls"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Session and context
    session_id = Column(String(36), nullable=True, index=True)  # For conversation chains

    # Model information
    model_name = Column(String(100), nullable=False, index=True)

    # Input
    input_prompt = Column(Text, nullable=False)
    message_history = Column(JSON, nullable=True)  # For conversation history
    input_tokens = Column(Integer, nullable=False)

    # Output
    output_content = Column(Text, nullable=True)  # Null if failed
    output_tokens = Column(Integer, default=0, nullable=False)
    total_tokens = Column(Integer, nullable=False)
    completion_reason = Column(Enum(CompletionReason), nullable=True)

    # Cost
    estimated_cost = Column(Numeric(10, 6), default=0.0, nullable=False)  # In USD

    # Status and timing
    status = Column(Enum(CallStatus), nullable=False, index=True)
    response_time_ms = Column(Integer, nullable=True)  # Response time in milliseconds
    error_message = Column(Text, nullable=True)  # Error details if failed

    # Parameters and metadata
    parameters = Column(JSON, nullable=True)  # temperature, max_tokens, top_p, etc.
    langchain_metadata = Column(JSON, nullable=True)  # chain_type, memory_type, etc.

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    # Relationships
    user = relationship("User", backref="model_calls")

    def __repr__(self) -> str:
        return f"<ModelCall(id={self.id}, model={self.model_name}, status={self.status}, user_id={self.user_id})>"
