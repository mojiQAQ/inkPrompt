"""Prompt test service."""
import uuid
from typing import Dict, Generator, List, Optional

from langchain_openai import ChatOpenAI
from sqlalchemy.orm import Session, joinedload

from app.core.config import get_settings, normalize_openai_base_url
from app.models.prompt_version import PromptVersion
from app.models.test_session import TestModelConversation, TestSession


class TestService:
    """Service for multi-model prompt testing."""

    @staticmethod
    def start_test_session(
        db: Session,
        prompt_version_id: str,
        user_id: str,
    ) -> TestSession:
        """Load or create a test session for the selected version."""
        session = db.query(TestSession).filter(
            TestSession.prompt_version_id == prompt_version_id,
            TestSession.user_id == user_id,
        ).options(joinedload(TestSession.conversations)).first()
        if session:
            return session

        session = TestSession(
            id=str(uuid.uuid4()),
            prompt_version_id=prompt_version_id,
            user_id=user_id,
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    @staticmethod
    def get_test_session(
        db: Session,
        prompt_version_id: str,
        user_id: str,
    ) -> Optional[TestSession]:
        """Get existing test session with conversations."""
        return db.query(TestSession).filter(
            TestSession.prompt_version_id == prompt_version_id,
            TestSession.user_id == user_id,
        ).options(joinedload(TestSession.conversations)).first()

    @staticmethod
    def get_or_create_conversation(
        db: Session,
        session: TestSession,
        prompt_version: PromptVersion,
        model_config: Dict,
    ) -> TestModelConversation:
        """Load or create per-model conversation."""
        model_name = model_config.get("name") or model_config.get("model") or "unknown-model"
        conversation = db.query(TestModelConversation).filter(
            TestModelConversation.test_session_id == session.id,
            TestModelConversation.model_name == model_name,
        ).first()
        if conversation:
            return conversation

        conversation = TestModelConversation(
            id=str(uuid.uuid4()),
            test_session_id=session.id,
            model_name=model_name,
            model_config=model_config,
            messages=[{"role": "system", "content": prompt_version.content}],
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        return conversation

    @staticmethod
    def test_model_stream(
        db: Session,
        user_id: str,
        prompt_version: PromptVersion,
        model_config: Dict,
        user_prompt: str,
        continue_conversation: bool = False,
    ) -> Generator[dict, None, TestModelConversation]:
        """Run single-model test and emit SSE-style events."""
        session = TestService.start_test_session(db, prompt_version.id, user_id)
        conversation = TestService.get_or_create_conversation(db, session, prompt_version, model_config)

        if not continue_conversation:
            conversation.messages = [{"role": "system", "content": prompt_version.content}]

        messages = list(conversation.messages or [])
        messages.append({"role": "user", "content": user_prompt})
        conversation.messages = messages
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

        yield {"type": "conversation_id", "data": {"conversation_id": conversation.id}}

        try:
            settings = get_settings()
            llm = ChatOpenAI(
                model=model_config.get("model") or "gpt-4",
                temperature=model_config.get("temperature", 0.7),
                openai_api_key=model_config.get("api_key") or settings.openai_api_key,
                base_url=normalize_openai_base_url(model_config.get("base_url")) or settings.openai_api_base,
            )
            response = llm.invoke(messages)
            content = response.content if hasattr(response, "content") else str(response)

            for chunk in TestService.chunk_text(content):
                yield {"type": "content", "data": chunk}

            messages.append({"role": "assistant", "content": content})
            conversation.messages = messages
            db.add(conversation)
            db.commit()
            db.refresh(conversation)

            yield {"type": "complete", "data": {}}
            return conversation
        except Exception as exc:
            db.rollback()
            yield {"type": "error", "data": {"message": str(exc)}}
            return conversation

    @staticmethod
    def chunk_text(text: str, chunk_size: int = 80) -> List[str]:
        """Split response into chunks for SSE."""
        if not text:
            return [""]
        return [text[index:index + chunk_size] for index in range(0, len(text), chunk_size)]
