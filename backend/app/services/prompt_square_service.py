"""Prompt square service layer."""
import json
import math
from typing import List, Optional, Tuple

from sqlalchemy import desc, func, or_
from sqlalchemy.orm import Session, selectinload

from app.models.prompt import Prompt
from app.models.prompt_folder import PromptFolder
from app.models.prompt_square import (
    PromptSquareCopyLog,
    PromptSquareEntry,
    PromptSquareFavorite,
    PromptSquareLike,
)
from app.models.tag import Tag, prompt_tags
from app.models.user import User
from app.schemas.prompt import PromptCreate
from app.schemas.prompt_square import PromptSquarePublishRequest
from app.services.prompt_folder_service import PromptFolderService
from app.services.prompt_service import PromptService


SQUARE_STATUS_PUBLISHED = "published"
SQUARE_MODERATION_APPROVED = "approved"
PREVIEW_LIMIT = 260

SQUARE_CATEGORIES = [
    {"key": "general", "label": "通用"},
    {"key": "writing", "label": "写作"},
    {"key": "coding", "label": "编程"},
    {"key": "analysis", "label": "分析"},
    {"key": "marketing", "label": "营销"},
    {"key": "education", "label": "学习"},
]


class PromptSquareService:
    """Prompt square business logic."""

    @staticmethod
    def _validate_target_folder(db: Session, folder_id: str, user_id: str) -> None:
        folder = (
            db.query(PromptFolder)
            .filter(
                PromptFolder.id == folder_id,
                PromptFolder.user_id == user_id,
                PromptFolder.is_system == False,
            )
            .first()
        )
        if folder is None:
            raise ValueError("文件夹不存在或为系统文件夹")

    @staticmethod
    def _parse_models(value: Optional[str]) -> List[str]:
        if not value:
            return []
        try:
            data = json.loads(value)
            if isinstance(data, list):
                return [str(item) for item in data if str(item).strip()]
        except json.JSONDecodeError:
            pass
        return []

    @staticmethod
    def _serialize_models(items: List[str]) -> str:
        return json.dumps(items, ensure_ascii=False)

    @staticmethod
    def _build_author(user: User) -> dict:
        default_name = user.email.split("@")[0] if user.email else "匿名创作者"
        return {
            "id": user.id,
            "name": user.full_name or default_name,
            "avatar_url": user.avatar_url,
        }

    @staticmethod
    def _build_preview(content: str) -> str:
        normalized = (content or "").strip()
        if len(normalized) <= PREVIEW_LIMIT:
            return normalized
        return f"{normalized[:PREVIEW_LIMIT].rstrip()}..."

    @staticmethod
    def _base_query(db: Session):
        return (
            db.query(PromptSquareEntry)
            .options(
                selectinload(PromptSquareEntry.prompt).selectinload(Prompt.tags),
                selectinload(PromptSquareEntry.user),
            )
            .filter(
                PromptSquareEntry.status == SQUARE_STATUS_PUBLISHED,
                PromptSquareEntry.moderation_status == SQUARE_MODERATION_APPROVED,
            )
        )

    @staticmethod
    def _build_entry_payload(
        db: Session,
        entry: PromptSquareEntry,
        current_user: Optional[User] = None,
        include_full_content: bool = False,
    ) -> dict:
        is_liked = False
        is_favorited = False
        if current_user:
            is_liked = (
                db.query(PromptSquareLike)
                .filter(
                    PromptSquareLike.entry_id == entry.id,
                    PromptSquareLike.user_id == current_user.id,
                )
                .first()
                is not None
            )
            is_favorited = (
                db.query(PromptSquareFavorite)
                .filter(
                    PromptSquareFavorite.entry_id == entry.id,
                    PromptSquareFavorite.user_id == current_user.id,
                )
                .first()
                is not None
            )

        content = entry.content_snapshot if include_full_content and entry.allow_full_preview else None
        prompt = entry.prompt
        tags = prompt.tags if prompt else []

        return {
            "id": entry.id,
            "prompt_id": entry.prompt_id,
            "title": entry.title,
            "summary": entry.summary,
            "category": entry.category,
            "difficulty": entry.difficulty,
            "tags": tags,
            "recommended_models": PromptSquareService._parse_models(entry.recommended_models),
            "allow_full_preview": entry.allow_full_preview,
            "preview_text": PromptSquareService._build_preview(entry.content_snapshot),
            "content": content,
            "views": entry.views,
            "likes": entry.likes,
            "favorites": entry.favorites,
            "copies": entry.copies,
            "is_liked": is_liked,
            "is_favorited": is_favorited,
            "author": PromptSquareService._build_author(entry.user),
            "published_at": entry.published_at,
            "updated_at": entry.updated_at,
        }

    @staticmethod
    def list_entries(
        db: Session,
        current_user: Optional[User] = None,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        category: Optional[str] = None,
        difficulty: Optional[str] = None,
        tag: Optional[str] = None,
        recommended_model: Optional[str] = None,
        sort_by: str = "hot",
    ) -> Tuple[List[dict], int, int]:
        """List public square entries."""
        query = PromptSquareService._base_query(db)

        if search:
            query = query.filter(
                or_(
                    PromptSquareEntry.title.ilike(f"%{search}%"),
                    PromptSquareEntry.summary.ilike(f"%{search}%"),
                    PromptSquareEntry.content_snapshot.ilike(f"%{search}%"),
                )
            )

        if category:
            query = query.filter(PromptSquareEntry.category == category)

        if difficulty:
            query = query.filter(PromptSquareEntry.difficulty == difficulty)

        if recommended_model:
            query = query.filter(PromptSquareEntry.recommended_models.ilike(f"%{recommended_model}%"))

        if tag:
            query = query.join(PromptSquareEntry.prompt).join(Prompt.tags).filter(Tag.name == tag)

        if sort_by == "newest":
            query = query.order_by(PromptSquareEntry.published_at.desc())
        elif sort_by == "copies":
            query = query.order_by(PromptSquareEntry.copies.desc(), PromptSquareEntry.published_at.desc())
        else:
            query = query.order_by(
                desc(PromptSquareEntry.copies * 4 + PromptSquareEntry.likes * 2 + PromptSquareEntry.views),
                PromptSquareEntry.published_at.desc(),
            )

        total = query.count()
        total_pages = math.ceil(total / page_size) if total > 0 else 1
        offset = (page - 1) * page_size
        entries = query.offset(offset).limit(page_size).all()
        return [
            PromptSquareService._build_entry_payload(db, entry, current_user=current_user)
            for entry in entries
        ], total, total_pages

    @staticmethod
    def get_entry(
        db: Session,
        entry_id: str,
        current_user: Optional[User] = None,
        increment_view: bool = True,
    ) -> Optional[dict]:
        """Get a single public entry."""
        entry = (
            PromptSquareService._base_query(db)
            .filter(PromptSquareEntry.id == entry_id)
            .first()
        )
        if not entry:
            return None

        if increment_view:
            entry.views += 1
            db.commit()
            db.refresh(entry)

        return PromptSquareService._build_entry_payload(
            db,
            entry,
            current_user=current_user,
            include_full_content=True,
        )

    @staticmethod
    def publish_prompt(
        db: Session,
        prompt_id: str,
        current_user: User,
        publish_data: PromptSquarePublishRequest,
    ) -> PromptSquareEntry:
        """Publish or update a prompt square entry."""
        prompt = (
            db.query(Prompt)
            .options(selectinload(Prompt.tags))
            .filter(Prompt.id == prompt_id, Prompt.user_id == current_user.id)
            .first()
        )
        if not prompt:
            raise ValueError("提示词不存在")

        entry = (
            db.query(PromptSquareEntry)
            .filter(PromptSquareEntry.prompt_id == prompt.id)
            .first()
        )

        if entry is None:
            entry = PromptSquareEntry(
                prompt_id=prompt.id,
                user_id=current_user.id,
            )
            db.add(entry)

        entry.title = publish_data.title
        entry.summary = publish_data.summary
        entry.category = publish_data.category
        entry.difficulty = publish_data.difficulty
        entry.recommended_models = PromptSquareService._serialize_models(publish_data.recommended_models)
        entry.content_snapshot = prompt.content
        entry.allow_full_preview = publish_data.allow_full_preview
        entry.status = SQUARE_STATUS_PUBLISHED
        entry.moderation_status = SQUARE_MODERATION_APPROVED

        db.commit()
        db.refresh(entry)
        return entry

    @staticmethod
    def unpublish_entry(db: Session, entry_id: str, current_user: User) -> PromptSquareEntry:
        """Archive a square entry."""
        entry = (
            db.query(PromptSquareEntry)
            .filter(
                PromptSquareEntry.id == entry_id,
                PromptSquareEntry.user_id == current_user.id,
            )
            .first()
        )
        if not entry:
            raise ValueError("广场条目不存在")

        entry.status = "archived"
        db.commit()
        db.refresh(entry)
        return entry

    @staticmethod
    def toggle_like(db: Session, entry_id: str, current_user: User) -> dict:
        """Toggle square like state."""
        entry = (
            db.query(PromptSquareEntry)
            .filter(
                PromptSquareEntry.id == entry_id,
                PromptSquareEntry.status == SQUARE_STATUS_PUBLISHED,
            )
            .first()
        )
        if not entry:
            raise ValueError("广场条目不存在")

        like = (
            db.query(PromptSquareLike)
            .filter(
                PromptSquareLike.entry_id == entry_id,
                PromptSquareLike.user_id == current_user.id,
            )
            .first()
        )

        if like:
            db.delete(like)
            entry.likes = max(0, entry.likes - 1)
            is_liked = False
        else:
            db.add(PromptSquareLike(entry_id=entry_id, user_id=current_user.id))
            entry.likes += 1
            is_liked = True

        db.commit()
        return {
            "success": True,
            "is_liked": is_liked,
            "likes": entry.likes,
        }

    @staticmethod
    def toggle_favorite(db: Session, entry_id: str, current_user: User) -> dict:
        """Toggle square favorite state."""
        entry = (
            db.query(PromptSquareEntry)
            .filter(
                PromptSquareEntry.id == entry_id,
                PromptSquareEntry.status == SQUARE_STATUS_PUBLISHED,
            )
            .first()
        )
        if not entry:
            raise ValueError("广场条目不存在")

        favorite = (
            db.query(PromptSquareFavorite)
            .filter(
                PromptSquareFavorite.entry_id == entry_id,
                PromptSquareFavorite.user_id == current_user.id,
            )
            .first()
        )

        if favorite:
            db.delete(favorite)
            entry.favorites = max(0, entry.favorites - 1)
            is_favorited = False
        else:
            db.add(PromptSquareFavorite(entry_id=entry_id, user_id=current_user.id))
            entry.favorites += 1
            is_favorited = True

        db.commit()
        return {
            "success": True,
            "is_favorited": is_favorited,
            "favorites": entry.favorites,
        }

    @staticmethod
    def copy_to_library(
        db: Session,
        entry_id: str,
        current_user: User,
        folder_id: Optional[str] = None,
    ) -> Tuple[Prompt, PromptSquareEntry, bool]:
        """Copy a public entry into the current user's prompt library."""
        entry = (
            db.query(PromptSquareEntry)
            .options(selectinload(PromptSquareEntry.prompt).selectinload(Prompt.tags))
            .filter(
                PromptSquareEntry.id == entry_id,
                PromptSquareEntry.status == SQUARE_STATUS_PUBLISHED,
            )
            .first()
        )
        if not entry:
            raise ValueError("广场条目不存在")

        if folder_id:
            PromptSquareService._validate_target_folder(db, folder_id, current_user.id)

        existing_prompt: Optional[Prompt] = None
        if entry.user_id == current_user.id:
            existing_prompt = (
                db.query(Prompt)
                .filter(
                    Prompt.id == entry.prompt_id,
                    Prompt.user_id == current_user.id,
                )
                .first()
            )

        if existing_prompt is None:
            existing_prompt = (
                db.query(Prompt)
                .filter(
                    Prompt.user_id == current_user.id,
                    Prompt.source_square_entry_id == entry.id,
                )
                .first()
            )

        if existing_prompt is not None:
            if folder_id:
                PromptFolderService.add_prompt_to_folder(db, folder_id, existing_prompt.id, current_user.id)
            db.refresh(entry)
            return existing_prompt, entry, False

        tag_names = [tag.name for tag in entry.prompt.tags] if entry.prompt else []
        copied_prompt = PromptService.create_prompt(
            db,
            current_user.id,
            PromptCreate(
                name=entry.title,
                content=entry.content_snapshot,
                tag_names=tag_names,
            ),
            source_square_entry_id=entry.id,
            source_square_title=entry.title,
        )

        if folder_id:
            PromptFolderService.add_prompt_to_folder(db, folder_id, copied_prompt.id, current_user.id)

        entry.copies += 1
        db.add(
            PromptSquareCopyLog(
                entry_id=entry.id,
                source_prompt_id=entry.prompt_id,
                target_prompt_id=copied_prompt.id,
                user_id=current_user.id,
            )
        )
        db.commit()
        db.refresh(entry)

        return copied_prompt, entry, True

    @staticmethod
    def get_categories() -> List[dict]:
        """Get supported categories."""
        return SQUARE_CATEGORIES

    @staticmethod
    def get_popular_tags(db: Session, limit: int = 12) -> List[dict]:
        """Aggregate popular tags from published entries."""
        rows = (
            db.query(
                Tag.id.label("id"),
                Tag.name.label("name"),
                func.count(PromptSquareEntry.id).label("count"),
            )
            .join(prompt_tags, prompt_tags.c.tag_id == Tag.id)
            .join(Prompt, Prompt.id == prompt_tags.c.prompt_id)
            .join(PromptSquareEntry, PromptSquareEntry.prompt_id == Prompt.id)
            .filter(
                PromptSquareEntry.status == SQUARE_STATUS_PUBLISHED,
                PromptSquareEntry.moderation_status == SQUARE_MODERATION_APPROVED,
            )
            .group_by(Tag.id, Tag.name)
            .order_by(desc("count"), Tag.name.asc())
            .limit(limit)
            .all()
        )
        return [
            {"id": row.id, "name": row.name, "count": row.count}
            for row in rows
        ]
