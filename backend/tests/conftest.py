"""
Pytest configuration and shared fixtures for InkPrompt tests.
"""
import os
import sys
import types
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

os.environ.setdefault("SUPABASE_URL", "http://test.local")
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-secret")
os.environ.setdefault("OPENAI_API_KEY", "test-openai-key")

if "langchain_openai" not in sys.modules:
    stub_module = types.ModuleType("langchain_openai")

    class ChatOpenAI:  # pragma: no cover - simple test stub
        def __init__(self, *args, **kwargs):
            self.args = args
            self.kwargs = kwargs

        def invoke(self, *_args, **_kwargs):
            return types.SimpleNamespace(content="")

    stub_module.ChatOpenAI = ChatOpenAI
    sys.modules["langchain_openai"] = stub_module

if "langchain" not in sys.modules:
    langchain_module = types.ModuleType("langchain")
    callbacks_module = types.ModuleType("langchain.callbacks")
    callbacks_base_module = types.ModuleType("langchain.callbacks.base")
    schema_module = types.ModuleType("langchain.schema")

    class BaseCallbackHandler:  # pragma: no cover - test stub
        pass

    class LLMResult:  # pragma: no cover - test stub
        def __init__(self, generations=None):
            self.generations = generations or []

    callbacks_base_module.BaseCallbackHandler = BaseCallbackHandler
    schema_module.LLMResult = LLMResult
    callbacks_module.base = callbacks_base_module
    langchain_module.callbacks = callbacks_module
    langchain_module.schema = schema_module
    sys.modules["langchain"] = langchain_module
    sys.modules["langchain.callbacks"] = callbacks_module
    sys.modules["langchain.callbacks.base"] = callbacks_base_module
    sys.modules["langchain.schema"] = schema_module

from app.main import app
from app.core.auth import get_current_user
from app.core.database import Base, get_db
from app.models.model_call import ModelCall
from app.models.prompt import Prompt
from app.models.prompt_version import PromptVersion
from app.models.tag import Tag
from app.models.user import User


TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(scope="function")
def test_engine():
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture(scope="function")
def test_db(test_engine) -> Generator[Session, None, None]:
    testing_session_local = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=test_engine,
    )
    session = testing_session_local()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def test_user(test_db: Session) -> User:
    user = User(
        id="test-user-id-123",
        email="test@example.com",
        full_name="Test User",
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user


@pytest.fixture(scope="function")
def client(test_db: Session, test_user: User) -> Generator[TestClient, None, None]:
    def override_get_db():
        try:
            yield test_db
        finally:
            pass

    def override_get_current_user():
        return test_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
def test_prompt(test_db: Session, test_user: User) -> Prompt:
    prompt = Prompt(
        id="test-prompt-id-123",
        name="Test Prompt",
        content="This is a test prompt for testing purposes.",
        user_id=test_user.id,
        token_count=10,
    )
    test_db.add(prompt)
    test_db.commit()
    test_db.refresh(prompt)
    return prompt


@pytest.fixture
def test_tag(test_db: Session) -> Tag:
    tag = Tag(
        id="test-tag-id-123",
        name="test-tag",
        is_system=False,
    )
    test_db.add(tag)
    test_db.commit()
    test_db.refresh(tag)
    return tag


@pytest.fixture
def test_version(test_db: Session, test_prompt: Prompt) -> PromptVersion:
    version = PromptVersion(
        id="test-version-id-123",
        prompt_id=test_prompt.id,
        version_number=1,
        content="Original content",
        token_count=10,
        change_note="Initial version",
    )
    test_db.add(version)
    test_db.commit()
    test_db.refresh(version)
    return version


@pytest.fixture
def auth_headers(test_user: User) -> dict:
    return {
        "Authorization": "Bearer test-token-123",
    }


@pytest.fixture
def mock_openai_key(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "sk-test-key-123")
    yield
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)


def create_prompt_data(
    name: str = "Test Prompt",
    content: str = "Test content",
    tag_names: list[str] | None = None,
) -> dict:
    """Helper to create prompt payloads."""
    return {
        "name": name,
        "content": content,
        "tag_names": tag_names or [],
    }


def create_multiple_prompts(
    db: Session,
    user: User,
    count: int = 3,
) -> list[Prompt]:
    """Helper to create multiple prompts for list/search tests."""
    prompts = []
    for index in range(count):
        prompt = Prompt(
            id=f"test-prompt-{index}",
            name=f"Test Prompt {index}",
            content=f"Test content {index}",
            user_id=user.id,
            token_count=10 + index,
        )
        db.add(prompt)
        prompts.append(prompt)

    db.commit()
    for prompt in prompts:
        db.refresh(prompt)

    return prompts
