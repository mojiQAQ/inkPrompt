"""Prompt schemas for request/response validation."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator


# Tag schemas (nested in prompt responses)
class TagBase(BaseModel):
    """Base tag schema."""
    name: str = Field(..., min_length=1, max_length=50)


class TagInDB(TagBase):
    """Tag schema as stored in database."""
    id: str
    is_system: bool
    use_count: int

    class Config:
        from_attributes = True


# Prompt schemas
class PromptCreate(BaseModel):
    """Schema for creating a new prompt."""
    name: str = Field(..., min_length=1, max_length=255, description="提示词名称")
    content: str = Field(..., min_length=1, description="提示词内容")
    tag_names: List[str] = Field(default_factory=list, description="标签名称列表")

    @field_validator('tag_names')
    @classmethod
    def validate_tag_names(cls, v):
        """Validate tag names."""
        if len(v) > 20:
            raise ValueError('最多只能添加 20 个标签')
        return [tag.strip() for tag in v if tag.strip()]


class PromptUpdate(BaseModel):
    """Schema for updating an existing prompt."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = Field(None, min_length=1)
    tag_names: Optional[List[str]] = None
    change_note: Optional[str] = Field(None, max_length=500, description="版本更新说明")

    @field_validator('tag_names')
    @classmethod
    def validate_tag_names(cls, v):
        """Validate tag names."""
        if v is not None and len(v) > 20:
            raise ValueError('最多只能添加 20 个标签')
        return [tag.strip() for tag in v if tag.strip()] if v else None


class PromptResponse(BaseModel):
    """Schema for prompt response."""
    id: str
    user_id: str
    name: str
    content: str
    token_count: int
    is_favorited: bool = False
    source_square_entry_id: Optional[str] = None
    source_square_title: Optional[str] = None
    tags: List[TagInDB] = []
    version_count: int = Field(default=0, description="版本数量")
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PromptListResponse(BaseModel):
    """Schema for paginated prompt list response."""
    items: List[PromptResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class PromptVersionResponse(BaseModel):
    """Schema for prompt version response."""
    id: str
    prompt_id: str
    version_number: int
    content: str
    token_count: int
    change_note: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
