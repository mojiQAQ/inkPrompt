"""Prompt square schemas."""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator

from app.schemas.prompt import TagInDB


VALID_DIFFICULTIES = {"simple", "medium", "advanced"}


class PromptSquareAuthor(BaseModel):
    """Public author information."""

    id: str
    name: str
    avatar_url: Optional[str] = None


class PromptSquareEntryResponse(BaseModel):
    """Prompt square item / detail response."""

    id: str
    prompt_id: str
    title: str
    summary: str
    category: str
    difficulty: str
    tags: List[TagInDB]
    recommended_models: List[str] = []
    allow_full_preview: bool
    preview_text: str
    content: Optional[str] = None
    views: int
    likes: int
    favorites: int
    copies: int
    is_liked: bool = False
    is_favorited: bool = False
    author: PromptSquareAuthor
    published_at: datetime
    updated_at: datetime


class PromptSquareListResponse(BaseModel):
    """Paginated square list response."""

    items: List[PromptSquareEntryResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class PromptSquareActionResponse(BaseModel):
    """Toggle like / favorite response."""

    success: bool = True
    is_liked: Optional[bool] = None
    is_favorited: Optional[bool] = None
    likes: Optional[int] = None
    favorites: Optional[int] = None


class PromptSquareCopyRequest(BaseModel):
    """Copy request."""

    folder_id: Optional[str] = None


class PromptSquareCopyResponse(BaseModel):
    """Copy result."""

    success: bool = True
    prompt_id: str
    entry_id: str
    copies: int
    created_new: bool
    already_saved: bool


class PromptSquarePublishRequest(BaseModel):
    """Publish prompt to square."""

    title: str = Field(..., min_length=1, max_length=255)
    summary: str = Field(..., min_length=1, max_length=500)
    category: str = Field(..., min_length=1, max_length=50)
    difficulty: str = Field(default="simple")
    recommended_models: List[str] = Field(default_factory=list)
    allow_full_preview: bool = False

    @field_validator("difficulty")
    @classmethod
    def validate_difficulty(cls, value: str) -> str:
        normalized = (value or "").strip().lower()
        if normalized not in VALID_DIFFICULTIES:
            raise ValueError("难度必须为 simple、medium 或 advanced")
        return normalized

    @field_validator("recommended_models")
    @classmethod
    def normalize_models(cls, value: List[str]) -> List[str]:
        return [item.strip() for item in value if item.strip()]


class PromptSquareTagSummary(BaseModel):
    """Popular square tag summary."""

    id: str
    name: str
    count: int


class PromptSquareCategorySummary(BaseModel):
    """Square category summary."""

    key: str
    label: str
