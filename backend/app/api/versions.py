"""Prompt version API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models import User, Prompt, PromptVersion
from app.schemas.version import PromptVersionResponse, VersionListResponse
from app.schemas.prompt import PromptResponse

router = APIRouter()


@router.get("/prompts/{prompt_id}/versions", response_model=VersionListResponse)
async def get_prompt_versions(
    prompt_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all versions of a prompt.

    Returns versions sorted by version_number in descending order (newest first).
    """
    # Check if prompt exists and belongs to user
    prompt = db.query(Prompt).filter(
        Prompt.id == prompt_id,
        Prompt.user_id == current_user.id
    ).first()

    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )

    # Get all versions
    versions = db.query(PromptVersion).filter(
        PromptVersion.prompt_id == prompt_id
    ).order_by(PromptVersion.version_number.desc()).all()

    return VersionListResponse(
        versions=versions,
        total=len(versions)
    )


@router.get("/prompts/{prompt_id}/versions/{version_id}", response_model=PromptVersionResponse)
async def get_version_detail(
    prompt_id: str,
    version_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get details of a specific version.
    """
    # Check if prompt exists and belongs to user
    prompt = db.query(Prompt).filter(
        Prompt.id == prompt_id,
        Prompt.user_id == current_user.id
    ).first()

    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )

    # Get version
    version = db.query(PromptVersion).filter(
        PromptVersion.id == version_id,
        PromptVersion.prompt_id == prompt_id
    ).first()

    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Version not found"
        )

    return version


@router.post("/prompts/{prompt_id}/versions/{version_id}/restore", response_model=PromptResponse)
async def restore_version(
    prompt_id: str,
    version_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Restore a prompt to a specific version.

    This creates a new version with the content from the specified historical version.
    """
    # Check if prompt exists and belongs to user
    prompt = db.query(Prompt).filter(
        Prompt.id == prompt_id,
        Prompt.user_id == current_user.id
    ).first()

    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )

    # Get the version to restore
    version_to_restore = db.query(PromptVersion).filter(
        PromptVersion.id == version_id,
        PromptVersion.prompt_id == prompt_id
    ).first()

    if not version_to_restore:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Version not found"
        )

    # Update prompt with version content
    prompt.content = version_to_restore.content
    prompt.token_count = version_to_restore.token_count

    # Create new version record
    import uuid
    from app.utils.token_counter import count_tokens

    # Get next version number
    latest_version = db.query(PromptVersion).filter(
        PromptVersion.prompt_id == prompt_id
    ).order_by(PromptVersion.version_number.desc()).first()

    next_version_number = (latest_version.version_number + 1) if latest_version else 1

    new_version = PromptVersion(
        id=str(uuid.uuid4()),
        prompt_id=prompt_id,
        version_number=next_version_number,
        content=version_to_restore.content,
        token_count=version_to_restore.token_count,
        change_note=f"恢复到版本 {version_to_restore.version_number}"
    )

    db.add(new_version)
    db.commit()
    db.refresh(prompt)

    return prompt
