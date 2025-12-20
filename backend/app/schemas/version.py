"""Prompt version schemas for request/response validation."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class PromptVersionResponse(BaseModel):
    """Schema for prompt version response."""
    id: str
    prompt_id: str
    version_number: int
    content: str
    token_count: int
    change_note: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class VersionListResponse(BaseModel):
    """Schema for version list response."""
    versions: list[PromptVersionResponse]
    total: int
