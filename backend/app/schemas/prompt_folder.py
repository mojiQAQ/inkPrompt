"""Prompt Folder schemas for request/response validation."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class FolderCreate(BaseModel):
    """Schema for creating a new folder."""
    name: str = Field(..., min_length=1, max_length=100, description="文件夹名称")


class FolderUpdate(BaseModel):
    """Schema for updating a folder."""
    name: str = Field(..., min_length=1, max_length=100, description="文件夹名称")


class FolderResponse(BaseModel):
    """Schema for folder response."""
    id: str
    user_id: str
    name: str
    is_system: bool
    sort_order: int
    prompt_count: int = Field(default=0, description="文件夹中的提示词数量")
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FolderListResponse(BaseModel):
    """Schema for folder list response."""
    items: List[FolderResponse]


class AddPromptToFolderRequest(BaseModel):
    """Schema for adding a prompt to a folder."""
    prompt_id: str = Field(..., description="要添加的提示词 ID")
