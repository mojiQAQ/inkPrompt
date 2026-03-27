"""Unit tests for prompt square copy flows."""
from sqlalchemy import select

from app.models.prompt import Prompt
from app.models.prompt_folder import prompt_folder_items
from app.models.prompt_square import PromptSquareCopyLog, PromptSquareEntry
from app.models.user import User
from app.services.prompt_folder_service import PromptFolderService
from app.services.prompt_square_service import PromptSquareService


def create_external_square_entry(test_db) -> PromptSquareEntry:
    author = User(
        id="square-author-id",
        email="author@example.com",
        full_name="Square Author",
    )
    source_prompt = Prompt(
        id="square-source-prompt-id",
        user_id=author.id,
        name="Square Source Prompt",
        content="You are a helpful assistant.",
        token_count=6,
    )
    entry = PromptSquareEntry(
        id="square-entry-id",
        prompt_id=source_prompt.id,
        user_id=author.id,
        title="Square Source Prompt",
        summary="A reusable assistant prompt",
        category="general",
        difficulty="simple",
        content_snapshot=source_prompt.content,
        allow_full_preview=True,
        status="published",
        moderation_status="approved",
    )
    test_db.add_all([author, source_prompt, entry])
    test_db.commit()
    test_db.refresh(entry)
    return entry


def test_copy_to_library_reuses_existing_prompt(test_db, test_user):
    entry = create_external_square_entry(test_db)

    first_prompt, first_entry, first_created = PromptSquareService.copy_to_library(
        test_db,
        entry.id,
        test_user,
    )
    second_prompt, second_entry, second_created = PromptSquareService.copy_to_library(
        test_db,
        entry.id,
        test_user,
    )

    copy_log_count = test_db.query(PromptSquareCopyLog).filter(
        PromptSquareCopyLog.entry_id == entry.id,
        PromptSquareCopyLog.user_id == test_user.id,
    ).count()

    assert first_created is True
    assert second_created is False
    assert first_prompt.id == second_prompt.id
    assert first_prompt.source_square_entry_id == entry.id
    assert first_prompt.source_square_title == entry.title
    assert first_entry.copies == 1
    assert second_entry.copies == 1
    assert copy_log_count == 1


def test_copy_to_library_returns_original_prompt_for_owner(test_db, test_prompt, test_user):
    entry = PromptSquareEntry(
        id="owner-square-entry-id",
        prompt_id=test_prompt.id,
        user_id=test_user.id,
        title=test_prompt.name,
        summary="Owner prompt in square",
        category="general",
        difficulty="simple",
        content_snapshot=test_prompt.content,
        allow_full_preview=True,
        status="published",
        moderation_status="approved",
    )
    test_db.add(entry)
    test_db.commit()
    test_db.refresh(entry)

    returned_prompt, returned_entry, created_new = PromptSquareService.copy_to_library(
        test_db,
        entry.id,
        test_user,
    )

    assert created_new is False
    assert returned_prompt.id == test_prompt.id
    assert returned_entry.copies == 0


def test_copy_to_library_supports_folder_target(test_db, test_user):
    entry = create_external_square_entry(test_db)
    folder = PromptFolderService.create_folder(test_db, test_user.id, "常用收藏")

    copied_prompt, _, created_new = PromptSquareService.copy_to_library(
        test_db,
        entry.id,
        test_user,
        folder_id=folder.id,
    )

    folder_link = test_db.execute(
        select(prompt_folder_items).where(
            prompt_folder_items.c.folder_id == folder.id,
            prompt_folder_items.c.prompt_id == copied_prompt.id,
        )
    ).first()

    assert created_new is True
    assert folder_link is not None
