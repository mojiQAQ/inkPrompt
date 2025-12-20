"""Model call schemas."""
from datetime import datetime
from typing import Optional
from decimal import Decimal
from pydantic import BaseModel, Field

from app.models.model_call import CallStatus, CompletionReason


class ModelCallResponse(BaseModel):
    """Schema for model call response."""
    id: str
    user_id: str
    session_id: Optional[str]
    model_name: str
    input_prompt: str
    input_tokens: int
    output_content: Optional[str]
    output_tokens: int
    total_tokens: int
    completion_reason: Optional[CompletionReason]
    estimated_cost: Decimal
    status: CallStatus
    response_time_ms: Optional[int]
    error_message: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ModelCallListResponse(BaseModel):
    """Schema for paginated model call list response."""
    items: list[ModelCallResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ModelCallStatsResponse(BaseModel):
    """Schema for model call statistics."""
    total_calls: int
    successful_calls: int
    failed_calls: int
    total_tokens: int
    total_cost: Decimal
    average_response_time_ms: Optional[float]
