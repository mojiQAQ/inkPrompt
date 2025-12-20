"""
Tags API endpoints
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.tag import TagCreate, TagResponse, TagListResponse
from app.services.tag_service import TagService

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("", response_model=TagListResponse)
def list_tags(
    search: Optional[str] = Query(None, description="Search term"),
    include_system: bool = Query(True, description="Include system tags"),
    popular_only: bool = Query(False, description="Only show popular tags"),
    limit: Optional[int] = Query(None, ge=1, le=100, description="Limit for popular tags"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> TagListResponse:
    """
    Get list of tags

    - **search**: Optional search term to filter tags
    - **include_system**: Whether to include system tags (default: true)
    - **popular_only**: Only return most popular tags
    - **limit**: Maximum number of tags when popular_only=true (default: 10)
    """
    if popular_only:
        tags = TagService.get_popular_tags(
            db=db,
            user_id=current_user.id,
            limit=limit or 10
        )
    else:
        tags = TagService.list_tags(
            db=db,
            user_id=current_user.id,
            search=search,
            include_system=include_system
        )

    return TagListResponse(
        items=tags,
        total=len(tags)
    )


@router.get("/{tag_id}", response_model=TagResponse)
def get_tag(
    tag_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> TagResponse:
    """
    Get a specific tag by ID
    """
    tag = TagService.get_tag(db=db, tag_id=tag_id, user_id=current_user.id)

    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found"
        )

    return tag


@router.post("", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
def create_tag(
    tag_data: TagCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> TagResponse:
    """
    Create a new tag

    - **name**: Tag name (1-50 characters)
    - **is_system**: Whether this is a system tag (only for admin users)
    """
    # Prevent regular users from creating system tags
    if tag_data.is_system:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot create system tags"
        )

    tag = TagService.create_tag(
        db=db,
        user_id=current_user.id,
        tag_data=tag_data
    )

    return tag


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tag(
    tag_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a tag

    - Can only delete user's own tags
    - Cannot delete system tags
    """
    success = TagService.delete_tag(
        db=db,
        tag_id=tag_id,
        user_id=current_user.id
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found or cannot be deleted"
        )

    return None
