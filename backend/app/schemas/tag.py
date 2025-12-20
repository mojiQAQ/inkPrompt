"""
Tag schemas for request/response validation
"""
from typing import Optional
from pydantic import BaseModel, Field


class TagBase(BaseModel):
    """Base tag schema"""
    name: str = Field(..., min_length=1, max_length=50)
    is_system: bool = False


class TagCreate(TagBase):
    """Schema for creating a tag"""
    pass


class TagResponse(TagBase):
    """Schema for tag response"""
    id: str
    use_count: int

    class Config:
        from_attributes = True


class TagListResponse(BaseModel):
    """Schema for tag list response"""
    items: list[TagResponse]
    total: int
