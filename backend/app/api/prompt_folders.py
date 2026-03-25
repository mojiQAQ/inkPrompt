"""Prompt Folder API endpoints."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.prompt_folder import (
    FolderCreate,
    FolderUpdate,
    FolderResponse,
    FolderListResponse,
    AddPromptToFolderRequest,
)
from app.services.prompt_folder_service import PromptFolderService

router = APIRouter(prefix="/folders", tags=["folders"])


@router.get("", response_model=FolderListResponse)
async def list_folders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FolderListResponse:
    """
    List all folders for the current user (including system folders).

    Returns:
        FolderListResponse: List of folders with prompt counts
    """
    folders = PromptFolderService.list_folders(db, current_user.id)
    return FolderListResponse(
        items=[FolderResponse(**f) for f in folders]
    )


@router.post("", response_model=FolderResponse, status_code=status.HTTP_201_CREATED)
async def create_folder(
    folder_data: FolderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FolderResponse:
    """
    Create a new custom folder.

    Args:
        folder_data: Folder creation data

    Returns:
        FolderResponse: Created folder
    """
    try:
        folder = PromptFolderService.create_folder(db, current_user.id, folder_data.name)
        return FolderResponse(
            id=folder.id,
            user_id=folder.user_id,
            name=folder.name,
            is_system=folder.is_system,
            sort_order=folder.sort_order,
            prompt_count=0,
            created_at=folder.created_at,
            updated_at=folder.updated_at,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.put("/{folder_id}", response_model=FolderResponse)
async def update_folder(
    folder_id: str,
    folder_data: FolderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FolderResponse:
    """
    Rename a folder.

    Args:
        folder_id: Folder ID
        folder_data: Update data

    Returns:
        FolderResponse: Updated folder
    """
    try:
        folder = PromptFolderService.update_folder(
            db, folder_id, current_user.id, folder_data.name
        )
        if not folder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="文件夹不存在",
            )
        return FolderResponse(
            id=folder.id,
            user_id=folder.user_id,
            name=folder.name,
            is_system=folder.is_system,
            sort_order=folder.sort_order,
            prompt_count=len(folder.prompts) if folder.prompts else 0,
            created_at=folder.created_at,
            updated_at=folder.updated_at,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.delete("/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_folder(
    folder_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """
    Delete a folder (does not delete prompts inside it).

    Args:
        folder_id: Folder ID
    """
    try:
        deleted = PromptFolderService.delete_folder(db, folder_id, current_user.id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="文件夹不存在",
            )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/{folder_id}/prompts", status_code=status.HTTP_200_OK)
async def add_prompt_to_folder(
    folder_id: str,
    data: AddPromptToFolderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """
    Add a prompt to a folder.

    Args:
        folder_id: Folder ID
        data: Contains prompt_id
    """
    try:
        PromptFolderService.add_prompt_to_folder(
            db, folder_id, data.prompt_id, current_user.id
        )
        return {"message": "已添加到文件夹"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.delete("/{folder_id}/prompts/{prompt_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_prompt_from_folder(
    folder_id: str,
    prompt_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """
    Remove a prompt from a folder.

    Args:
        folder_id: Folder ID
        prompt_id: Prompt ID
    """
    removed = PromptFolderService.remove_prompt_from_folder(
        db, folder_id, prompt_id, current_user.id
    )
    if not removed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="文件夹不存在",
        )
