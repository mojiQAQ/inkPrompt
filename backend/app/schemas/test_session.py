"""Test session schemas."""
from datetime import datetime
from typing import Any, Dict, List, Literal

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    """Single chat message schema."""
    role: Literal["system", "user", "assistant"]
    content: str


class TestModelConversationResponse(BaseModel):
    """Test model conversation response schema."""
    id: str
    test_session_id: str
    model_name: str
    model_config_data: Dict[str, Any] = Field(default_factory=dict, alias="model_config")
    messages: List[ChatMessage] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True


class TestSessionResponse(BaseModel):
    """Test session response schema."""
    id: str
    prompt_version_id: str
    user_id: str
    conversations: List[TestModelConversationResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
