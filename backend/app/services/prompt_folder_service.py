"""Prompt Folder service layer for business logic."""
import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.prompt_folder import PromptFolder, prompt_folder_items
from app.models.prompt import Prompt


# System folder names
SYSTEM_FOLDER_ALL = "全部提示词"
SYSTEM_FOLDER_FAVORITES = "收藏提示词"


class PromptFolderService:
    """Service for prompt folder-related business logic."""

    @staticmethod
    def init_system_folders(db: Session, user_id: str) -> List[PromptFolder]:
        """
        Initialize system folders for a user (全部提示词, 收藏提示词).

        Args:
            db: Database session
            user_id: User ID

        Returns:
            List[PromptFolder]: Created or existing system folders
        """
        system_folders = []
        folder_configs = [
            {"name": SYSTEM_FOLDER_ALL, "sort_order": 0},
            {"name": SYSTEM_FOLDER_FAVORITES, "sort_order": 1},
        ]

        for config in folder_configs:
            existing = db.query(PromptFolder).filter(
                PromptFolder.user_id == user_id,
                PromptFolder.name == config["name"],
                PromptFolder.is_system == True,
            ).first()

            if not existing:
                folder = PromptFolder(
                    id=str(uuid.uuid4()),
                    user_id=user_id,
                    name=config["name"],
                    is_system=True,
                    sort_order=config["sort_order"],
                )
                db.add(folder)
                system_folders.append(folder)
            else:
                system_folders.append(existing)

        db.commit()
        return system_folders

    @staticmethod
    def list_folders(db: Session, user_id: str) -> List[dict]:
        """
        List all folders for a user with prompt counts.

        Args:
            db: Database session
            user_id: User ID

        Returns:
            List[dict]: Folders with prompt_count
        """
        # Ensure system folders exist
        PromptFolderService.init_system_folders(db, user_id)

        folders = db.query(PromptFolder).filter(
            PromptFolder.user_id == user_id
        ).order_by(PromptFolder.sort_order.asc(), PromptFolder.created_at.asc()).all()

        result = []
        for folder in folders:
            if folder.name == SYSTEM_FOLDER_ALL:
                # "全部提示词" shows total count
                prompt_count = db.query(Prompt).filter(
                    Prompt.user_id == user_id
                ).count()
            elif folder.name == SYSTEM_FOLDER_FAVORITES:
                # "收藏提示词" shows favorited count
                prompt_count = db.query(Prompt).filter(
                    Prompt.user_id == user_id,
                    Prompt.is_favorited == True,
                ).count()
            else:
                # Custom folders show their item count
                prompt_count = db.query(prompt_folder_items).filter(
                    prompt_folder_items.c.folder_id == folder.id
                ).count()

            result.append({
                "id": folder.id,
                "user_id": folder.user_id,
                "name": folder.name,
                "is_system": folder.is_system,
                "sort_order": folder.sort_order,
                "prompt_count": prompt_count,
                "created_at": folder.created_at,
                "updated_at": folder.updated_at,
            })

        return result

    @staticmethod
    def create_folder(db: Session, user_id: str, name: str) -> PromptFolder:
        """
        Create a new custom folder.

        Args:
            db: Database session
            user_id: User ID
            name: Folder name

        Returns:
            PromptFolder: Created folder
        """
        # Check duplicate name
        existing = db.query(PromptFolder).filter(
            PromptFolder.user_id == user_id,
            PromptFolder.name == name,
        ).first()
        if existing:
            raise ValueError(f"文件夹 '{name}' 已存在")

        # Get max sort_order for user
        max_order = db.query(func.max(PromptFolder.sort_order)).filter(
            PromptFolder.user_id == user_id
        ).scalar() or 0

        folder = PromptFolder(
            id=str(uuid.uuid4()),
            user_id=user_id,
            name=name,
            is_system=False,
            sort_order=max_order + 1,
        )
        db.add(folder)
        db.commit()
        db.refresh(folder)

        return folder

    @staticmethod
    def update_folder(db: Session, folder_id: str, user_id: str, name: str) -> Optional[PromptFolder]:
        """
        Rename a folder.

        Args:
            db: Database session
            folder_id: Folder ID
            user_id: User ID
            name: New folder name

        Returns:
            Optional[PromptFolder]: Updated folder or None
        """
        folder = db.query(PromptFolder).filter(
            PromptFolder.id == folder_id,
            PromptFolder.user_id == user_id,
        ).first()

        if not folder:
            return None

        if folder.is_system:
            raise ValueError("系统文件夹不允许重命名")

        # Check duplicate name
        existing = db.query(PromptFolder).filter(
            PromptFolder.user_id == user_id,
            PromptFolder.name == name,
            PromptFolder.id != folder_id,
        ).first()
        if existing:
            raise ValueError(f"文件夹 '{name}' 已存在")

        folder.name = name
        db.commit()
        db.refresh(folder)

        return folder

    @staticmethod
    def delete_folder(db: Session, folder_id: str, user_id: str) -> bool:
        """
        Delete a folder (does not delete prompts).

        Args:
            db: Database session
            folder_id: Folder ID
            user_id: User ID

        Returns:
            bool: True if deleted
        """
        folder = db.query(PromptFolder).filter(
            PromptFolder.id == folder_id,
            PromptFolder.user_id == user_id,
        ).first()

        if not folder:
            return False

        if folder.is_system:
            raise ValueError("系统文件夹不允许删除")

        db.delete(folder)
        db.commit()

        return True

    @staticmethod
    def add_prompt_to_folder(db: Session, folder_id: str, prompt_id: str, user_id: str) -> bool:
        """
        Add a prompt to a folder.

        Args:
            db: Database session
            folder_id: Folder ID
            prompt_id: Prompt ID
            user_id: User ID

        Returns:
            bool: True if added
        """
        # Verify folder belongs to user and is not system
        folder = db.query(PromptFolder).filter(
            PromptFolder.id == folder_id,
            PromptFolder.user_id == user_id,
            PromptFolder.is_system == False,
        ).first()

        if not folder:
            raise ValueError("文件夹不存在或为系统文件夹")

        # Verify prompt belongs to user
        prompt = db.query(Prompt).filter(
            Prompt.id == prompt_id,
            Prompt.user_id == user_id,
        ).first()

        if not prompt:
            raise ValueError("提示词不存在")

        # Check if already in folder
        existing = db.execute(
            prompt_folder_items.select().where(
                prompt_folder_items.c.folder_id == folder_id,
                prompt_folder_items.c.prompt_id == prompt_id,
            )
        ).first()

        if existing:
            return True  # Already in folder

        db.execute(
            prompt_folder_items.insert().values(
                folder_id=folder_id,
                prompt_id=prompt_id,
            )
        )
        db.commit()

        return True

    @staticmethod
    def remove_prompt_from_folder(db: Session, folder_id: str, prompt_id: str, user_id: str) -> bool:
        """
        Remove a prompt from a folder.

        Args:
            db: Database session
            folder_id: Folder ID
            prompt_id: Prompt ID
            user_id: User ID

        Returns:
            bool: True if removed
        """
        # Verify folder belongs to user
        folder = db.query(PromptFolder).filter(
            PromptFolder.id == folder_id,
            PromptFolder.user_id == user_id,
        ).first()

        if not folder:
            return False

        db.execute(
            prompt_folder_items.delete().where(
                prompt_folder_items.c.folder_id == folder_id,
                prompt_folder_items.c.prompt_id == prompt_id,
            )
        )
        db.commit()

        return True

    @staticmethod
    def toggle_favorite(db: Session, prompt_id: str, user_id: str) -> Optional[bool]:
        """
        Toggle favorite status of a prompt.

        Args:
            db: Database session
            prompt_id: Prompt ID
            user_id: User ID

        Returns:
            Optional[bool]: New favorite status, or None if prompt not found
        """
        prompt = db.query(Prompt).filter(
            Prompt.id == prompt_id,
            Prompt.user_id == user_id,
        ).first()

        if not prompt:
            return None

        prompt.is_favorited = not prompt.is_favorited
        db.commit()

        return prompt.is_favorited
