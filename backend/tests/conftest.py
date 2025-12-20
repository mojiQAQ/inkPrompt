"""
Pytest configuration and shared fixtures for InkPrompt tests
"""
import os
import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

# Import app and database dependencies
from app.main import app
from app.core.database import Base, get_db
from app.models.user import User
from app.models.prompt import Prompt
from app.models.tag import Tag
from app.models.prompt_version import PromptVersion
from app.models.model_call import ModelCall


# Test database URL (in-memory SQLite)
TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(scope="function")
def test_engine():
    """Create a test database engine"""
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
    """Create a test database session"""
    TestingSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=test_engine
    )
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="function")
def client(test_db: Session) -> Generator[TestClient, None, None]:
    """Create a test client with test database"""
    def override_get_db():
        try:
            yield test_db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
def test_user(test_db: Session) -> User:
    """Create a test user"""
    user = User(
        id="test-user-id-123",
        email="test@example.com",
        supabase_user_id="supabase-test-id"
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user


@pytest.fixture
def test_prompt(test_db: Session, test_user: User) -> Prompt:
    """Create a test prompt"""
    prompt = Prompt(
        id="test-prompt-id-123",
        name="Test Prompt",
        content="This is a test prompt for testing purposes.",
        user_id=test_user.id,
        token_count=10
    )
    test_db.add(prompt)
    test_db.commit()
    test_db.refresh(prompt)
    return prompt


@pytest.fixture
def test_tag(test_db: Session) -> Tag:
    """Create a test tag"""
    tag = Tag(
        name="test-tag",
        is_system=False
    )
    test_db.add(tag)
    test_db.commit()
    test_db.refresh(tag)
    return tag


@pytest.fixture
def test_version(test_db: Session, test_prompt: Prompt) -> PromptVersion:
    """Create a test prompt version"""
    version = PromptVersion(
        prompt_id=test_prompt.id,
        version_number=1,
        content="Original content",
        token_count=10,
        change_note="Initial version"
    )
    test_db.add(version)
    test_db.commit()
    test_db.refresh(version)
    return version


@pytest.fixture
def auth_headers(test_user: User) -> dict:
    """Create authentication headers for testing"""
    # In a real test, you'd generate a valid JWT token
    # For now, we'll use a mock token
    return {
        "Authorization": "Bearer test-token-123"
    }


@pytest.fixture
def mock_openai_key(monkeypatch):
    """Mock OpenAI API key for testing"""
    monkeypatch.setenv("OPENAI_API_KEY", "sk-test-key-123")
    yield
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)


# Utility functions for tests

def create_prompt_data(
    name: str = "Test Prompt",
    content: str = "Test content",
    tag_names: list[str] = None
) -> dict:
    """Helper to create prompt data dict"""
    return {
        "name": name,
        "content": content,
        "tag_names": tag_names or []
    }


def create_multiple_prompts(
    db: Session,
    user: User,
    count: int = 3
) -> list[Prompt]:
    """Helper to create multiple test prompts"""
    prompts = []
    for i in range(count):
        prompt = Prompt(
            id=f"test-prompt-{i}",
            name=f"Test Prompt {i}",
            content=f"Test content {i}",
            user_id=user.id,
            token_count=10 + i
        )
        db.add(prompt)
        prompts.append(prompt)

    db.commit()
    for prompt in prompts:
        db.refresh(prompt)

    return prompts
