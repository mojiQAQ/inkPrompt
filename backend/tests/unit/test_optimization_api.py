"""
Unit tests for Prompt Optimization API
Tests: Module 9.2 - 优化 API 单元测试
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.prompt import Prompt
from app.models.user import User
from app.schemas.optimization import OptimizationScenario


@pytest.mark.unit
class TestOptimizationAPI:
    """测试提示词优化 API"""

    @patch('app.services.optimization_service.create_chat_model')
    def test_optimize_prompt_success(
        self,
        mock_create_model,
        client: TestClient,
        test_prompt: Prompt,
        auth_headers: dict
    ):
        """测试成功优化提示词"""
        # Mock LLM response
        mock_llm = MagicMock()
        mock_response = MagicMock()
        mock_response.content = "This is an optimized version of the prompt with better structure and clarity."
        mock_llm.invoke.return_value = mock_response
        mock_create_model.return_value = mock_llm

        # 发送优化请求
        request_data = {
            "scenario": "general"
        }
        response = client.post(
            f"/api/prompts/{test_prompt.id}/optimize",
            json=request_data,
            headers=auth_headers
        )

        # 验证响应
        assert response.status_code == 200
        data = response.json()

        assert "optimized_content" in data
        assert "suggestions" in data
        assert "token_count" in data
        assert "estimated_cost" in data

        assert isinstance(data["suggestions"], list)
        assert data["token_count"] > 0
        assert data["estimated_cost"] >= 0

    @patch('app.services.optimization_service.create_chat_model')
    def test_optimize_with_different_scenarios(
        self,
        mock_create_model,
        client: TestClient,
        test_prompt: Prompt,
        auth_headers: dict
    ):
        """测试不同优化场景"""
        # Mock LLM
        mock_llm = MagicMock()
        mock_response = MagicMock()
        mock_response.content = "Optimized content"
        mock_llm.invoke.return_value = mock_response
        mock_create_model.return_value = mock_llm

        scenarios = [
            "general",
            "content_creation",
            "code_generation",
            "data_analysis",
            "conversation"
        ]

        for scenario in scenarios:
            request_data = {"scenario": scenario}
            response = client.post(
                f"/api/prompts/{test_prompt.id}/optimize",
                json=request_data,
                headers=auth_headers
            )

            assert response.status_code == 200
            data = response.json()
            assert "optimized_content" in data

    def test_optimize_nonexistent_prompt(
        self,
        client: TestClient,
        auth_headers: dict
    ):
        """测试优化不存在的提示词"""
        request_data = {"scenario": "general"}
        response = client.post(
            "/api/prompts/nonexistent-id/optimize",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == 404

    def test_optimize_invalid_scenario(
        self,
        client: TestClient,
        test_prompt: Prompt,
        auth_headers: dict
    ):
        """测试无效的优化场景"""
        request_data = {"scenario": "invalid_scenario"}
        response = client.post(
            f"/api/prompts/{test_prompt.id}/optimize",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == 422  # Validation error

    @patch('app.services.optimization_service.create_chat_model')
    def test_optimize_with_custom_requirements(
        self,
        mock_create_model,
        client: TestClient,
        test_prompt: Prompt,
        auth_headers: dict
    ):
        """测试使用自定义要求的优化"""
        # Mock LLM
        mock_llm = MagicMock()
        mock_response = MagicMock()
        mock_response.content = "Optimized with custom requirements"
        mock_llm.invoke.return_value = mock_response
        mock_create_model.return_value = mock_llm

        request_data = {
            "scenario": "general",
            "custom_requirements": "Make it suitable for technical audience"
        }
        response = client.post(
            f"/api/prompts/{test_prompt.id}/optimize",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "optimized_content" in data

    @patch('app.services.optimization_service.create_chat_model')
    def test_optimize_tracks_cost(
        self,
        mock_create_model,
        client: TestClient,
        test_prompt: Prompt,
        auth_headers: dict
    ):
        """测试优化记录成本"""
        # Mock LLM
        mock_llm = MagicMock()
        mock_response = MagicMock()
        mock_response.content = "Optimized content for cost tracking test"
        mock_llm.invoke.return_value = mock_response
        mock_create_model.return_value = mock_llm

        request_data = {"scenario": "general"}
        response = client.post(
            f"/api/prompts/{test_prompt.id}/optimize",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        # 验证成本估算
        assert "estimated_cost" in data
        assert isinstance(data["estimated_cost"], (int, float))
        assert data["estimated_cost"] >= 0


@pytest.mark.unit
class TestOptimizationScenarios:
    """测试优化场景枚举"""

    def test_all_scenarios_defined(self):
        """测试所有场景都已定义"""
        expected_scenarios = {
            OptimizationScenario.GENERAL,
            OptimizationScenario.CONTENT_CREATION,
            OptimizationScenario.CODE_GENERATION,
            OptimizationScenario.DATA_ANALYSIS,
            OptimizationScenario.CONVERSATION
        }

        # 验证所有场景都存在
        assert len(expected_scenarios) == 5

        for scenario in expected_scenarios:
            assert isinstance(scenario.value, str)
            assert len(scenario.value) > 0


@pytest.mark.unit
@patch('app.services.optimization_service.create_chat_model')
class TestOptimizationErrorHandling:
    """测试优化错误处理"""

    def test_optimize_llm_error(
        self,
        mock_create_model,
        client: TestClient,
        test_prompt: Prompt,
        auth_headers: dict
    ):
        """测试 LLM 调用失败"""
        # Mock LLM to raise an error
        mock_llm = MagicMock()
        mock_llm.invoke.side_effect = Exception("API Error")
        mock_create_model.return_value = mock_llm

        request_data = {"scenario": "general"}
        response = client.post(
            f"/api/prompts/{test_prompt.id}/optimize",
            json=request_data,
            headers=auth_headers
        )

        # 应该返回 500 错误
        assert response.status_code == 500

    def test_optimize_empty_response(
        self,
        mock_create_model,
        client: TestClient,
        test_prompt: Prompt,
        auth_headers: dict
    ):
        """测试 LLM 返回空内容"""
        # Mock LLM with empty response
        mock_llm = MagicMock()
        mock_response = MagicMock()
        mock_response.content = ""
        mock_llm.invoke.return_value = mock_response
        mock_create_model.return_value = mock_llm

        request_data = {"scenario": "general"}
        response = client.post(
            f"/api/prompts/{test_prompt.id}/optimize",
            json=request_data,
            headers=auth_headers
        )

        # 仍然应该返回成功，但内容为空
        assert response.status_code == 200
        data = response.json()
        assert data["optimized_content"] == ""


@pytest.mark.unit
class TestOptimizationRequestValidation:
    """测试优化请求验证"""

    def test_missing_scenario(
        self,
        client: TestClient,
        test_prompt: Prompt,
        auth_headers: dict
    ):
        """测试缺少 scenario 字段"""
        request_data = {}  # 没有 scenario
        response = client.post(
            f"/api/prompts/{test_prompt.id}/optimize",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == 422  # Validation error

    def test_scenario_case_sensitive(
        self,
        client: TestClient,
        test_prompt: Prompt,
        auth_headers: dict
    ):
        """测试 scenario 大小写"""
        request_data = {"scenario": "GENERAL"}  # 大写
        response = client.post(
            f"/api/prompts/{test_prompt.id}/optimize",
            json=request_data,
            headers=auth_headers
        )

        # 应该失败，因为枚举值是小写
        assert response.status_code == 422
