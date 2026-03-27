"""Tests for system data initialization."""
from sqlalchemy.orm import Session

from app.models.prompt import Prompt
from app.models.prompt_square import PromptSquareEntry
from app.models.prompt_version import PromptVersion
from app.models.user import User
from app.utils.init_data import (
    CURATED_SQUARE_AUTHOR,
    CURATED_SQUARE_PROMPTS,
    init_curated_square_entries,
    init_system_tags,
)


class TestInitData:
    """Test suite for startup data initialization."""

    def test_init_curated_square_entries_creates_default_content(self, test_db: Session):
        init_system_tags(test_db)

        created_count = init_curated_square_entries(test_db)

        assert created_count == len(CURATED_SQUARE_PROMPTS)

        curator = test_db.query(User).filter(
            User.id == CURATED_SQUARE_AUTHOR["id"]
        ).one_or_none()
        assert curator is not None
        assert curator.full_name == CURATED_SQUARE_AUTHOR["full_name"]

        square_entries = test_db.query(PromptSquareEntry).all()
        prompts = test_db.query(Prompt).filter(
            Prompt.user_id == CURATED_SQUARE_AUTHOR["id"]
        ).all()
        versions = test_db.query(PromptVersion).join(
            Prompt, PromptVersion.prompt_id == Prompt.id
        ).filter(
            Prompt.user_id == CURATED_SQUARE_AUTHOR["id"]
        ).all()

        assert len(square_entries) == len(CURATED_SQUARE_PROMPTS)
        assert len(prompts) == len(CURATED_SQUARE_PROMPTS)
        assert len(versions) == len(CURATED_SQUARE_PROMPTS)
        assert all(entry.allow_full_preview for entry in square_entries)

    def test_init_curated_square_entries_is_idempotent(self, test_db: Session):
        init_system_tags(test_db)

        first_count = init_curated_square_entries(test_db)
        second_count = init_curated_square_entries(test_db)

        assert first_count == len(CURATED_SQUARE_PROMPTS)
        assert second_count == 0
        assert test_db.query(PromptSquareEntry).count() == len(CURATED_SQUARE_PROMPTS)
        assert test_db.query(Prompt).filter(
            Prompt.user_id == CURATED_SQUARE_AUTHOR["id"]
        ).count() == len(CURATED_SQUARE_PROMPTS)
