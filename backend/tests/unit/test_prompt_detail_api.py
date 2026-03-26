"""
Unit tests for prompt detail APIs.
"""
import json
from unittest.mock import MagicMock, patch

import pytest
from sqlalchemy.orm import Session

from app.models.prompt import Prompt
from app.models.prompt_version import PromptVersion


@pytest.mark.unit
class TestOptimizationSessionAPI:
    def test_get_optimization_session_initializes_empty_session(
        self,
        client,
        test_prompt: Prompt,
    ):
        response = client.get(f"/api/prompts/{test_prompt.id}/optimization/session")

        assert response.status_code == 200
        data = response.json()
        assert data["prompt_id"] == test_prompt.id
        assert data["rounds"] == []
        assert data["user_id"] == "test-user-id-123"

    @patch("app.services.optimization_service.create_chat_model")
    def test_optimize_stream_creates_round_and_version(
        self,
        mock_create_model,
        client,
        test_db: Session,
        test_prompt: Prompt,
        test_version: PromptVersion,
    ):
        mock_llm = MagicMock()
        mock_llm.invoke.return_value = MagicMock(
            content="优化后的提示词内容\n---SUGGESTIONS---\n"
            + json.dumps(
                {
                    "domain": "软件开发",
                    "questions": [
                        {"question": "是否补充输出格式？", "options": ["Markdown", "JSON"]}
                    ],
                },
                ensure_ascii=False,
            )
        )
        mock_create_model.return_value = mock_llm

        response = client.post(
            f"/api/prompts/{test_prompt.id}/{test_version.id}/optimize/stream",
            json={
                "user_idea": "让提示词更聚焦",
                "selected_suggestions": {"是否补充输出格式？": ["Markdown"]},
            },
        )

        assert response.status_code == 200
        body = response.text
        assert "event: round_start" in body
        assert "event: content" in body
        assert "event: suggestions" in body
        assert "event: version_saved" in body
        assert "event: complete" in body

        session_response = client.get(f"/api/prompts/{test_prompt.id}/optimization/session")
        session_data = session_response.json()
        assert len(session_data["rounds"]) == 1
        assert session_data["rounds"][0]["version_id"] is not None
        assert session_data["rounds"][0]["user_idea"] == "让提示词更聚焦"
        assert session_data["rounds"][0]["domain_analysis"] == "软件开发"

        versions_response = client.get(f"/api/prompts/{test_prompt.id}/versions")
        versions_data = versions_response.json()
        assert versions_data["total"] == 2
        assert versions_data["versions"][0]["version_number"] == 2

        persisted_prompt = test_db.query(Prompt).filter(Prompt.id == test_prompt.id).first()
        assert persisted_prompt is not None
        assert persisted_prompt.content == "优化后的提示词内容"


@pytest.mark.unit
class TestTestSessionAPI:
    def test_get_test_session_initializes_empty_session(
        self,
        client,
        test_version: PromptVersion,
    ):
        response = client.get(f"/api/prompts/{test_version.id}/test/session")

        assert response.status_code == 200
        data = response.json()
        assert data["prompt_version_id"] == test_version.id
        assert data["conversations"] == []

    @patch("app.services.test_service.ChatOpenAI")
    def test_test_stream_creates_conversation_and_appends_messages(
        self,
        mock_chat_openai,
        client,
        test_version: PromptVersion,
    ):
        mock_llm = MagicMock()
        mock_llm.invoke.return_value = MagicMock(content="模型回复")
        mock_chat_openai.return_value = mock_llm

        request_data = {
            "model": {
                "name": "GPT-4",
                "base_url": "https://api.openai.com/v1",
                "model": "gpt-4",
            },
            "user_prompt": "请分析这段提示词",
            "continue": False,
        }

        response = client.post(
            f"/api/prompts/{test_version.id}/test/stream",
            json=request_data,
        )

        assert response.status_code == 200
        body = response.text
        assert "event: conversation_id" in body
        assert "event: content" in body
        assert "event: complete" in body

        session_response = client.get(f"/api/prompts/{test_version.id}/test/session")
        session_data = session_response.json()
        assert len(session_data["conversations"]) == 1
        conversation = session_data["conversations"][0]
        assert conversation["model_name"] == "GPT-4"
        assert [message["role"] for message in conversation["messages"]] == [
            "system",
            "user",
            "assistant",
        ]

        continue_response = client.post(
            f"/api/prompts/{test_version.id}/test/stream",
            json={
                "model": {
                    "name": "GPT-4",
                    "base_url": "https://api.openai.com/v1",
                    "model": "gpt-4",
                },
                "user_prompt": "继续补充输出格式",
                "continue": True,
            },
        )

        assert continue_response.status_code == 200
        session_response = client.get(f"/api/prompts/{test_version.id}/test/session")
        session_data = session_response.json()
        assert len(session_data["conversations"]) == 1
        conversation = session_data["conversations"][0]
        assert len(conversation["messages"]) == 5
        assert conversation["messages"][-1]["role"] == "assistant"

    @patch("app.services.test_service.ChatOpenAI")
    def test_test_stream_emits_error_event_when_model_call_fails(
        self,
        mock_chat_openai,
        client,
        test_version: PromptVersion,
    ):
        mock_llm = MagicMock()
        mock_llm.invoke.side_effect = Exception("invalid_api_key")
        mock_chat_openai.return_value = mock_llm

        response = client.post(
            f"/api/prompts/{test_version.id}/test/stream",
            json={
                "model": {
                    "name": "当前配置模型",
                    "base_url": "https://openrouter.ai/api/v1",
                    "model": "openai/gpt-4o-mini",
                },
                "user_prompt": "请帮我总结",
                "continue": False,
            },
        )

        assert response.status_code == 200
        body = response.text
        assert "event: conversation_id" in body
        assert "event: error" in body
        assert "invalid_api_key" in body

        session_response = client.get(f"/api/prompts/{test_version.id}/test/session")
        session_data = session_response.json()
        assert len(session_data["conversations"]) == 1
        conversation = session_data["conversations"][0]
        assert [message["role"] for message in conversation["messages"]] == [
            "system",
            "user",
        ]


@pytest.mark.unit
class TestAvailableModelsAPI:
    def test_available_models_endpoint_uses_resolved_settings_payload(
        self,
        client,
    ):
        with patch("app.api.available_models.get_settings") as mock_get_settings:
            mock_get_settings.return_value = MagicMock(
                AVAILABLE_MODELS=[
                    {
                        "name": "当前配置模型",
                        "base_url": "{{OPENAI_API_BASE}}",
                        "model": "{{DEFAULT_MODEL}}",
                        "api_key": "{{OPENAI_API_KEY}}",
                    },
                    {
                        "name": "缺少密钥模型",
                        "base_url": "https://example.com/v1",
                        "model": "example-model",
                        "api_key": "",
                    },
                ],
                openai_api_base="https://openrouter.ai/api/v1",
                default_model="openai/gpt-4o-mini",
                openai_api_key="sk-or-v1-test",
                MAX_CONCURRENT_TEST_MODELS=3,
            )

            response = client.get("/api/models")

        assert response.status_code == 200
        data = response.json()
        assert data["items"] == [
            {
                "name": "当前配置模型",
                "base_url": "https://openrouter.ai/api/v1",
                "model": "openai/gpt-4o-mini",
                "params": {},
            }
        ]
        assert data["max_concurrent_test_models"] == 3
