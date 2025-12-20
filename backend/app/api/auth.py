"""Authentication API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])


class UserResponse(BaseModel):
    """User response schema."""
    id: str
    email: str | None
    full_name: str | None
    avatar_url: str | None

    class Config:
        from_attributes = True


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
) -> UserResponse:
    """
    Get current authenticated user information.

    Returns:
        UserResponse: Current user information

    Raises:
        HTTPException: 401 if not authenticated
    """
    return UserResponse.model_validate(current_user)


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user)
) -> dict:
    """
    Logout endpoint (client-side token removal).

    Note: This is primarily for API consistency.
    Actual token invalidation happens on the client side.

    Returns:
        dict: Success message
    """
    return {"message": "Successfully logged out"}


@router.get("/health")
async def auth_health_check() -> dict:
    """
    Health check for authentication service.

    Returns:
        dict: Service status
    """
    return {
        "status": "healthy",
        "service": "authentication"
    }
