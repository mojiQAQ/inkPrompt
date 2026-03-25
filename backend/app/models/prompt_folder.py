"""Prompt Folder model."""
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Table
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


# Association table for many-to-many relationship between PromptFolder and Prompt
prompt_folder_items = Table(
    "prompt_folder_items",
    Base.metadata,
    Column("folder_id", String(36), ForeignKey("prompt_folders.id", ondelete="CASCADE"), primary_key=True),
    Column("prompt_id", String(36), ForeignKey("prompts.id", ondelete="CASCADE"), primary_key=True),
    Column("created_at", DateTime(timezone=True), server_default=func.now(), nullable=False),
)


class PromptFolder(Base):
    """PromptFolder model - stores user prompt folders for organization."""

    __tablename__ = "prompt_folders"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    is_system = Column(Boolean, default=False, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="folders")
    prompts = relationship("Prompt", secondary=prompt_folder_items, back_populates="folders")

    def __repr__(self) -> str:
        folder_type = "system" if self.is_system else "user"
        return f"<PromptFolder(id={self.id}, name={self.name}, type={folder_type})>"
