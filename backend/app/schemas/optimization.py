"""Optimization and test session schemas."""
from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class OptimizationScenario(str, Enum):
    """Optimization scenario types."""
    GENERAL = "general"
    CONTENT_CREATION = "content_creation"
    CODE_GENERATION = "code_generation"
    DATA_ANALYSIS = "data_analysis"
    CONVERSATION = "conversation"


class OptimizationRequest(BaseModel):
    """Request for prompt optimization."""
    scenario: OptimizationScenario = Field(..., description="优化场景")
    custom_requirements: Optional[str] = Field(None, description="自定义要求")


class OptimizationResponse(BaseModel):
    """Response from prompt optimization."""
    optimized_content: str = Field(..., description="优化后的提示词")
    suggestions: list[str] = Field(default_factory=list, description="改进建议")
    token_count: int = Field(..., description="优化后的 token 数")
    estimated_cost: float = Field(..., description="本次优化的估算成本（USD）")


class OptimizeSuggestion(BaseModel):
    """Structured optimize suggestion."""

    question: str
    options: List[str] = Field(default_factory=list)


class OptimizationRoundResponse(BaseModel):
    """Optimization round payload."""

    id: str
    session_id: str
    round_number: int
    user_idea: Optional[str] = None
    selected_suggestions: Optional[Dict[str, List[str]]] = None
    optimized_content: str
    suggestions: List[OptimizeSuggestion] = Field(default_factory=list)
    domain_analysis: str = ""
    version_id: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OptimizationSessionResponse(BaseModel):
    """Optimization session payload."""

    id: str
    prompt_id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    rounds: List[OptimizationRoundResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class OptimizeStreamRequest(BaseModel):
    """SSE optimization request."""

    user_idea: Optional[str] = None
    selected_suggestions: Optional[Dict[str, List[str]]] = None


class ChatMessage(BaseModel):
    """Chat message stored in test conversation."""

    role: Literal["system", "user", "assistant"]
    content: str


class ModelConfigResponse(BaseModel):
    """Available model config payload."""

    name: str
    base_url: str
    model: str
    api_key: Optional[str] = None
    params: Dict[str, Any] = Field(default_factory=dict)


class TestModelConversationResponse(BaseModel):
    """Model conversation payload."""

    id: str
    test_session_id: str
    model_name: str
    model_config: Dict[str, Any] = Field(default_factory=dict)
    messages: List[ChatMessage] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TestSessionResponse(BaseModel):
    """Test session payload."""

    id: str
    prompt_version_id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    conversations: List[TestModelConversationResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class TestStreamRequest(BaseModel):
    """Single model stream request."""

    model: ModelConfigResponse
    user_prompt: str
    continue_conversation: bool = Field(default=False, alias="continue")

    model_config = ConfigDict(populate_by_name=True)
