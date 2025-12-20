"""Authentication utilities for JWT validation."""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import get_settings

settings = get_settings()
from app.core.database import get_db
from app.models.user import User

security = HTTPBearer()


def verify_supabase_token(token: str) -> dict:
    """
    Verify Supabase JWT token.

    Args:
        token: JWT token from Supabase

    Returns:
        dict: Decoded token payload

    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            options={"verify_aud": False}  # Supabase doesn't use aud claim
        )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Get current authenticated user from JWT token.

    Args:
        credentials: HTTP Authorization credentials with Bearer token
        db: Database session

    Returns:
        User: Current authenticated user

    Raises:
        HTTPException: If token is invalid or user not found
    """
    token = credentials.credentials
    payload = verify_supabase_token(token)

    # Extract user ID from Supabase token
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Get or create user
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        # Create new user from Supabase token
        email = payload.get("email")
        user_metadata = payload.get("user_metadata", {})

        user = User(
            id=user_id,
            email=email,
            full_name=user_metadata.get("full_name"),
            avatar_url=user_metadata.get("avatar_url"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update last login time
        user.last_login_at = datetime.utcnow()
        db.commit()

    return user


def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Get current user if authenticated, otherwise return None.
    Useful for endpoints that work both with and without authentication.

    Args:
        credentials: HTTP Authorization credentials with Bearer token
        db: Database session

    Returns:
        Optional[User]: Current user or None if not authenticated
    """
    if credentials is None:
        return None

    try:
        return get_current_user(credentials, db)
    except HTTPException:
        return None
