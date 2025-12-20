"""
Tag service layer for business logic
"""
from typing import Optional
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.tag import Tag
from app.schemas.tag import TagCreate


class TagService:
    """Service class for tag operations"""

    @staticmethod
    def list_tags(
        db: Session,
        user_id: str,
        search: Optional[str] = None,
        include_system: bool = True
    ) -> list[Tag]:
        """
        Get list of tags with optional search filter

        Args:
            db: Database session
            user_id: User ID
            search: Optional search term
            include_system: Include system tags

        Returns:
            List of tags sorted by use_count descending
        """
        query = db.query(Tag)

        # Filter by user or system tags
        if include_system:
            query = query.filter(
                (Tag.user_id == user_id) | (Tag.is_system == True)
            )
        else:
            query = query.filter(Tag.user_id == user_id)

        # Search filter
        if search:
            query = query.filter(Tag.name.ilike(f'%{search}%'))

        # Order by use count and name
        tags = query.order_by(Tag.use_count.desc(), Tag.name).all()

        return tags

    @staticmethod
    def get_tag(db: Session, tag_id: str, user_id: str) -> Optional[Tag]:
        """
        Get a specific tag by ID

        Args:
            db: Database session
            tag_id: Tag ID
            user_id: User ID

        Returns:
            Tag if found and accessible, None otherwise
        """
        tag = db.query(Tag).filter(Tag.id == tag_id).first()

        if not tag:
            return None

        # Check access permissions
        if not tag.is_system and tag.user_id != user_id:
            return None

        return tag

    @staticmethod
    def create_tag(
        db: Session,
        user_id: str,
        tag_data: TagCreate
    ) -> Tag:
        """
        Create a new tag

        Args:
            db: Database session
            user_id: User ID
            tag_data: Tag creation data

        Returns:
            Created tag
        """
        # Check if tag with same name already exists for this user
        existing_tag = db.query(Tag).filter(
            Tag.name == tag_data.name,
            (Tag.user_id == user_id) | (Tag.is_system == True)
        ).first()

        if existing_tag:
            return existing_tag

        # Create new tag
        tag = Tag(
            name=tag_data.name,
            is_system=tag_data.is_system,
            user_id=user_id if not tag_data.is_system else None,
            use_count=0
        )

        db.add(tag)
        db.commit()
        db.refresh(tag)

        return tag

    @staticmethod
    def get_or_create_tag(
        db: Session,
        user_id: str,
        tag_name: str
    ) -> Tag:
        """
        Get existing tag or create new one

        Args:
            db: Database session
            user_id: User ID
            tag_name: Tag name

        Returns:
            Tag (existing or newly created)
        """
        # Try to find existing tag (user's own or system tag)
        tag = db.query(Tag).filter(
            Tag.name == tag_name,
            (Tag.user_id == user_id) | (Tag.is_system == True)
        ).first()

        if tag:
            return tag

        # Create new tag
        tag = Tag(
            name=tag_name,
            is_system=False,
            user_id=user_id,
            use_count=0
        )

        db.add(tag)
        db.commit()
        db.refresh(tag)

        return tag

    @staticmethod
    def delete_tag(db: Session, tag_id: str, user_id: str) -> bool:
        """
        Delete a tag

        Args:
            db: Database session
            tag_id: Tag ID
            user_id: User ID

        Returns:
            True if deleted, False if not found or not authorized
        """
        tag = db.query(Tag).filter(Tag.id == tag_id).first()

        if not tag:
            return False

        # Cannot delete system tags
        if tag.is_system:
            return False

        # Check ownership
        if tag.user_id != user_id:
            return False

        db.delete(tag)
        db.commit()

        return True

    @staticmethod
    def get_popular_tags(
        db: Session,
        user_id: str,
        limit: int = 10
    ) -> list[Tag]:
        """
        Get most popular tags

        Args:
            db: Database session
            user_id: User ID
            limit: Maximum number of tags to return

        Returns:
            List of most popular tags
        """
        tags = db.query(Tag).filter(
            (Tag.user_id == user_id) | (Tag.is_system == True)
        ).order_by(
            Tag.use_count.desc()
        ).limit(limit).all()

        return tags
