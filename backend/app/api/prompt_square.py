"""Prompt square API endpoints."""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user, get_optional_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.prompt_square import (
    PromptSquareActionResponse,
    PromptSquareCategorySummary,
    PromptSquareCopyRequest,
    PromptSquareCopyResponse,
    PromptSquareEntryResponse,
    PromptSquareListResponse,
    PromptSquarePublishRequest,
    PromptSquareTagSummary,
)
from app.services.prompt_square_service import PromptSquareService

router = APIRouter(prefix="/square", tags=["prompt-square"])


@router.get("/entries", response_model=PromptSquareListResponse)
async def list_square_entries(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    recommended_model: Optional[str] = Query(None),
    sort_by: str = Query("hot", regex="^(hot|newest|copies)$"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
) -> PromptSquareListResponse:
    items, total, total_pages = PromptSquareService.list_entries(
        db=db,
        current_user=current_user,
        page=page,
        page_size=page_size,
        search=search,
        category=category,
        difficulty=difficulty,
        tag=tag,
        recommended_model=recommended_model,
        sort_by=sort_by,
    )
    return PromptSquareListResponse(
        items=[PromptSquareEntryResponse(**item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/entries/{entry_id}", response_model=PromptSquareEntryResponse)
async def get_square_entry(
    entry_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
) -> PromptSquareEntryResponse:
    item = PromptSquareService.get_entry(db=db, entry_id=entry_id, current_user=current_user)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="广场条目不存在")
    return PromptSquareEntryResponse(**item)


@router.get("/tags/popular", response_model=List[PromptSquareTagSummary])
async def get_popular_tags(
    limit: int = Query(12, ge=1, le=50),
    db: Session = Depends(get_db),
) -> List[PromptSquareTagSummary]:
    return [PromptSquareTagSummary(**item) for item in PromptSquareService.get_popular_tags(db, limit)]


@router.get("/categories", response_model=List[PromptSquareCategorySummary])
async def get_categories() -> List[PromptSquareCategorySummary]:
    return [PromptSquareCategorySummary(**item) for item in PromptSquareService.get_categories()]


@router.post("/entries/{entry_id}/like", response_model=PromptSquareActionResponse)
async def toggle_square_like(
    entry_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PromptSquareActionResponse:
    try:
        result = PromptSquareService.toggle_like(db, entry_id, current_user)
        return PromptSquareActionResponse(**result)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.post("/entries/{entry_id}/favorite", response_model=PromptSquareActionResponse)
async def toggle_square_favorite(
    entry_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PromptSquareActionResponse:
    try:
        result = PromptSquareService.toggle_favorite(db, entry_id, current_user)
        return PromptSquareActionResponse(**result)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.post("/entries/{entry_id}/copy", response_model=PromptSquareCopyResponse)
async def copy_square_entry(
    entry_id: str,
    payload: PromptSquareCopyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PromptSquareCopyResponse:
    try:
        prompt, entry, created_new = PromptSquareService.copy_to_library(
            db,
            entry_id,
            current_user,
            folder_id=payload.folder_id,
        )
        return PromptSquareCopyResponse(
            prompt_id=prompt.id,
            entry_id=entry.id,
            copies=entry.copies,
            created_new=created_new,
            already_saved=not created_new,
        )
    except ValueError as exc:
        error_message = str(exc)
        status_code = status.HTTP_404_NOT_FOUND if error_message == "广场条目不存在" else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=error_message)


@router.post("/prompts/{prompt_id}/publish", response_model=PromptSquareEntryResponse)
async def publish_prompt_to_square(
    prompt_id: str,
    payload: PromptSquarePublishRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PromptSquareEntryResponse:
    try:
        entry = PromptSquareService.publish_prompt(db, prompt_id, current_user, payload)
        item = PromptSquareService.get_entry(
            db,
            entry.id,
            current_user=current_user,
            increment_view=False,
        )
        if item is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="发布失败")
        return PromptSquareEntryResponse(**item)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post("/entries/{entry_id}/unpublish", response_model=PromptSquareActionResponse)
async def unpublish_square_entry(
    entry_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PromptSquareActionResponse:
    try:
        PromptSquareService.unpublish_entry(db, entry_id, current_user)
        return PromptSquareActionResponse(success=True)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
