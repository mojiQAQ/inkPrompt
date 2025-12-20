"""Prompt service layer for business logic."""
import uuid
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.models.prompt import Prompt
from app.models.prompt_version import PromptVersion
from app.models.tag import Tag
from app.schemas.prompt import PromptCreate, PromptUpdate
from app.utils.token_counter import count_tokens


class PromptService:
    """Service for prompt-related business logic."""

    @staticmethod
    def create_prompt(
        db: Session,
        user_id: str,
        prompt_data: PromptCreate
    ) -> Prompt:
        """
        Create a new prompt with tags and initial version.

        Args:
            db: Database session
            user_id: ID of the user creating the prompt
            prompt_data: Prompt creation data

        Returns:
            Prompt: Created prompt with tags
        """
        # Calculate token count
        token_count = count_tokens(prompt_data.content)

        # Create prompt
        prompt = Prompt(
            id=str(uuid.uuid4()),
            user_id=user_id,
            name=prompt_data.name,
            content=prompt_data.content,
            token_count=token_count,
        )

        # Handle tags
        if prompt_data.tag_names:
            tags = PromptService._get_or_create_tags(db, user_id, prompt_data.tag_names)
            prompt.tags = tags

        db.add(prompt)
        db.flush()

        # Create initial version
        version = PromptVersion(
            id=str(uuid.uuid4()),
            prompt_id=prompt.id,
            version_number=1,
            content=prompt.content,
            token_count=token_count,
            change_note="初始版本",
        )
        db.add(version)
        db.commit()
        db.refresh(prompt)

        return prompt

    @staticmethod
    def get_prompt(
        db: Session,
        prompt_id: str,
        user_id: str
    ) -> Optional[Prompt]:
        """
        Get a prompt by ID (must belong to user).

        Args:
            db: Database session
            prompt_id: Prompt ID
            user_id: User ID

        Returns:
            Optional[Prompt]: Prompt if found and belongs to user
        """
        return db.query(Prompt).filter(
            Prompt.id == prompt_id,
            Prompt.user_id == user_id
        ).first()

    @staticmethod
    def list_prompts(
        db: Session,
        user_id: str,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        tag_names: Optional[List[str]] = None,
        tag_logic: str = "OR",
        sort_by: str = "updated_at",
        sort_order: str = "desc"
    ) -> Tuple[List[Prompt], int]:
        """
        List prompts with pagination, search, and tag filtering.

        Args:
            db: Database session
            user_id: User ID
            page: Page number (1-indexed)
            page_size: Items per page
            search: Search query (searches in name and content)
            tag_names: Filter by tag names
            tag_logic: Tag filtering logic - "OR" (any tag) or "AND" (all tags)
            sort_by: Sort field (updated_at/created_at/name/token_count)
            sort_order: Sort direction (asc/desc)

        Returns:
            Tuple[List[Prompt], int]: (prompts, total_count)
        """
        query = db.query(Prompt).filter(Prompt.user_id == user_id)

        # Search filter (full-text search on name and content)
        if search:
            search_filter = or_(
                Prompt.name.ilike(f"%{search}%"),
                Prompt.content.ilike(f"%{search}%")
            )
            query = query.filter(search_filter)

        # Tag filter with AND/OR logic
        if tag_names:
            if tag_logic == "AND":
                # AND logic: prompt must have all specified tags
                for tag_name in tag_names:
                    query = query.filter(Prompt.tags.any(Tag.name == tag_name))
            else:
                # OR logic: prompt must have at least one of the specified tags
                query = query.join(Prompt.tags).filter(Tag.name.in_(tag_names)).distinct()

        # Get total count before pagination
        total = query.count()

        # Apply sorting
        sort_column = getattr(Prompt, sort_by, Prompt.updated_at)
        if sort_order == "asc":
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())

        # Apply pagination
        offset = (page - 1) * page_size
        prompts = query.offset(offset).limit(page_size).all()

        return prompts, total

    @staticmethod
    def update_prompt(
        db: Session,
        prompt: Prompt,
        prompt_data: PromptUpdate
    ) -> Prompt:
        """
        Update a prompt and create a new version if content changed.

        Args:
            db: Database session
            prompt: Prompt to update
            prompt_data: Update data

        Returns:
            Prompt: Updated prompt
        """
        content_changed = False

        # Update name
        if prompt_data.name is not None:
            prompt.name = prompt_data.name

        # Update content
        if prompt_data.content is not None and prompt_data.content != prompt.content:
            prompt.content = prompt_data.content
            prompt.token_count = count_tokens(prompt_data.content)
            content_changed = True

        # Update tags
        if prompt_data.tag_names is not None:
            tags = PromptService._get_or_create_tags(db, prompt.user_id, prompt_data.tag_names)
            prompt.tags = tags

        db.flush()

        # Create new version if content changed
        if content_changed:
            # Get latest version number
            latest_version = db.query(func.max(PromptVersion.version_number)).filter(
                PromptVersion.prompt_id == prompt.id
            ).scalar() or 0

            version = PromptVersion(
                id=str(uuid.uuid4()),
                prompt_id=prompt.id,
                version_number=latest_version + 1,
                content=prompt.content,
                token_count=prompt.token_count,
                change_note=prompt_data.change_note or f"版本 {latest_version + 1}",
            )
            db.add(version)

        db.commit()
        db.refresh(prompt)

        return prompt

    @staticmethod
    def delete_prompt(db: Session, prompt: Prompt) -> None:
        """
        Delete a prompt (cascade deletes versions and tag associations).

        Args:
            db: Database session
            prompt: Prompt to delete
        """
        db.delete(prompt)
        db.commit()

    @staticmethod
    def get_prompt_versions(
        db: Session,
        prompt_id: str,
        user_id: str
    ) -> List[PromptVersion]:
        """
        Get all versions of a prompt.

        Args:
            db: Database session
            prompt_id: Prompt ID
            user_id: User ID (for authorization)

        Returns:
            List[PromptVersion]: List of versions (newest first)
        """
        # Verify prompt belongs to user
        prompt = db.query(Prompt).filter(
            Prompt.id == prompt_id,
            Prompt.user_id == user_id
        ).first()

        if not prompt:
            return []

        return db.query(PromptVersion).filter(
            PromptVersion.prompt_id == prompt_id
        ).order_by(PromptVersion.version_number.desc()).all()

    @staticmethod
    def _get_or_create_tags(
        db: Session,
        user_id: str,
        tag_names: List[str]
    ) -> List[Tag]:
        """
        Get existing tags or create new ones.

        Args:
            db: Database session
            user_id: User ID
            tag_names: List of tag names

        Returns:
            List[Tag]: List of tag objects
        """
        tags = []
        for name in tag_names:
            # Try to find existing tag (system or user's)
            tag = db.query(Tag).filter(
                Tag.name == name,
                or_(Tag.is_system == True, Tag.user_id == user_id)
            ).first()

            if not tag:
                # Create new user tag
                tag = Tag(
                    id=str(uuid.uuid4()),
                    user_id=user_id,
                    name=name,
                    is_system=False,
                    use_count=0,
                )
                db.add(tag)
                db.flush()

            # Increment use count
            tag.use_count += 1
            tags.append(tag)

        return tags
