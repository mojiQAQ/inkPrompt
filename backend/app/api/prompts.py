"""Prompt API endpoints."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
import math

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.prompt import (
    PromptCreate,
    PromptUpdate,
    PromptResponse,
    PromptListResponse,
)
from app.services.prompt_service import PromptService

router = APIRouter(prefix="/prompts", tags=["prompts"])


@router.post("", response_model=PromptResponse, status_code=status.HTTP_201_CREATED)
async def create_prompt(
    prompt_data: PromptCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> PromptResponse:
    """
    Create a new prompt.

    Args:
        prompt_data: Prompt creation data
        current_user: Current authenticated user
        db: Database session

    Returns:
        PromptResponse: Created prompt

    Raises:
        HTTPException: 400 if validation fails
    """
    prompt = PromptService.create_prompt(db, current_user.id, prompt_data)
    return PromptResponse.model_validate(prompt)


@router.get("", response_model=PromptListResponse)
async def list_prompts(
    page: int = Query(1, ge=1, description="页码（从 1 开始）"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量（1-100）"),
    search: Optional[str] = Query(None, description="搜索关键词（搜索名称和内容）"),
    tags: Optional[str] = Query(None, description="标签过滤（逗号分隔）"),
    tag_logic: str = Query("OR", regex="^(AND|OR)$", description="标签筛选逻辑（AND/OR）"),
    sort_by: str = Query("updated_at", regex="^(updated_at|created_at|name|token_count)$", description="排序字段"),
    sort_order: str = Query("desc", regex="^(asc|desc)$", description="排序方向"),
    folder_id: Optional[str] = Query(None, description="文件夹 ID 过滤"),
    favorites_only: bool = Query(False, description="只显示收藏的提示词"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> PromptListResponse:
    """
    List prompts with pagination, search, and filtering.
    """
    # Parse tags
    tag_names = [tag.strip() for tag in tags.split(",")] if tags else None

    # Get prompts
    prompts, total = PromptService.list_prompts(
        db,
        user_id=current_user.id,
        page=page,
        page_size=page_size,
        search=search,
        tag_names=tag_names,
        tag_logic=tag_logic,
        sort_by=sort_by,
        sort_order=sort_order,
        folder_id=folder_id,
        favorites_only=favorites_only,
    )

    # Calculate total pages
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return PromptListResponse(
        items=[PromptResponse.model_validate(p) for p in prompts],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/{prompt_id}", response_model=PromptResponse)
async def get_prompt(
    prompt_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> PromptResponse:
    """
    Get a specific prompt by ID.

    Args:
        prompt_id: Prompt ID
        current_user: Current authenticated user
        db: Database session

    Returns:
        PromptResponse: Prompt details

    Raises:
        HTTPException: 404 if prompt not found or doesn't belong to user
    """
    prompt = PromptService.get_prompt(db, prompt_id, current_user.id)
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )

    return PromptResponse.model_validate(prompt)


@router.put("/{prompt_id}", response_model=PromptResponse)
async def update_prompt(
    prompt_id: str,
    prompt_data: PromptUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> PromptResponse:
    """
    Update an existing prompt.

    Args:
        prompt_id: Prompt ID
        prompt_data: Update data
        current_user: Current authenticated user
        db: Database session

    Returns:
        PromptResponse: Updated prompt

    Raises:
        HTTPException: 404 if prompt not found or doesn't belong to user
    """
    prompt = PromptService.get_prompt(db, prompt_id, current_user.id)
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )

    updated_prompt = PromptService.update_prompt(db, prompt, prompt_data)
    return PromptResponse.model_validate(updated_prompt)


@router.delete("/{prompt_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_prompt(
    prompt_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> None:
    """
    Delete a prompt.

    Args:
        prompt_id: Prompt ID
        current_user: Current authenticated user
        db: Database session

    Raises:
        HTTPException: 404 if prompt not found or doesn't belong to user
    """
    prompt = PromptService.get_prompt(db, prompt_id, current_user.id)
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )

    PromptService.delete_prompt(db, prompt)


@router.put("/{prompt_id}/favorite")
async def toggle_favorite(
    prompt_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> dict:
    """
    Toggle favorite status of a prompt.
    """
    from app.services.prompt_folder_service import PromptFolderService
    result = PromptFolderService.toggle_favorite(db, prompt_id, current_user.id)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )
    return {"is_favorited": result}

