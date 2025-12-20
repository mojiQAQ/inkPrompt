"""
Unit tests for LangChain integration
Tests: Module 9.3 - LangChain 调用链测试
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from sqlalchemy.orm import Session

from app.core.langchain_config import LangChainConfig, get_langchain_config
from app.callbacks.call_tracker import CallTrackerHandler, calculate_cost, count_tokens
from app.models.user import User
from app.models.model_call import ModelCall, CallStatus


@pytest.mark.unit
class TestLangChainConfig:
    """测试 LangChain 配置"""

    @patch.dict('os.environ', {
        'OPENAI_API_KEY': 'test-key',
        'DEFAULT_MODEL': 'gpt-3.5-turbo',
        'DEFAULT_TEMPERATURE': '0.7'
    })
    def test_config_initialization(self):
        """测试配置初始化"""
        config = LangChainConfig()

        assert config.api_key == 'test-key'
        assert config.default_model == 'gpt-3.5-turbo'
        assert config.default_temperature == 0.7

    @patch.dict('os.environ', {'OPENAI_API_KEY': 'test-key'})
    def test_config_defaults(self):
        """测试默认配置值"""
        config = LangChainConfig()

        assert config.default_model == 'gpt-3.5-turbo'
        assert config.default_temperature == 0.7
        assert config.max_tokens == 4000

    def test_config_validation_missing_key(self):
        """测试缺少 API key 的验证"""
        config = LangChainConfig()
        config.api_key = None

        is_valid, message = config.validate_config()

        assert not is_valid
        assert "API key" in message.lower()

    @patch.dict('os.environ', {'OPENAI_API_KEY': 'test-key'})
    def test_config_validation_success(self):
        """测试配置验证成功"""
        config = LangChainConfig()

        is_valid, message = config.validate_config()

        assert is_valid
        assert message == "Configuration is valid"

    @patch.dict('os.environ', {'OPENAI_API_KEY': 'test-key'})
    @patch('app.core.langchain_config.ChatOpenAI')
    def test_create_chat_model(self, mock_chat_openai):
        """测试创建聊天模型"""
        config = LangChainConfig()

        model = config.create_chat_model(
            model='gpt-4',
            temperature=0.5,
            max_tokens=2000
        )

        # 验证 ChatOpenAI 被正确调用
        mock_chat_openai.assert_called_once()
        call_kwargs = mock_chat_openai.call_args.kwargs

        assert call_kwargs['model'] == 'gpt-4'
        assert call_kwargs['temperature'] == 0.5
        assert call_kwargs['max_tokens'] == 2000

    @patch.dict('os.environ', {'OPENAI_API_KEY': 'test-key'})
    def test_get_langchain_config_singleton(self):
        """测试配置单例模式"""
        config1 = get_langchain_config()
        config2 = get_langchain_config()

        assert config1 is config2  # 同一个实例


@pytest.mark.unit
class TestTokenCounting:
    """测试 Token 计数"""

    def test_count_tokens_simple_text(self):
        """测试简单文本的 token 计数"""
        text = "Hello, world!"
        token_count = count_tokens(text)

        assert token_count > 0
        assert isinstance(token_count, int)

    def test_count_tokens_empty_string(self):
        """测试空字符串"""
        token_count = count_tokens("")

        assert token_count == 0

    def test_count_tokens_chinese_text(self):
        """测试中文文本"""
        text = "你好，世界！"
        token_count = count_tokens(text)

        assert token_count > 0

    def test_count_tokens_with_model(self):
        """测试指定模型的 token 计数"""
        text = "Test message"

        count_gpt35 = count_tokens(text, model="gpt-3.5-turbo")
        count_gpt4 = count_tokens(text, model="gpt-4")

        # GPT-3.5 和 GPT-4 使用相同的编码
        assert count_gpt35 == count_gpt4


@pytest.mark.unit
class TestCostCalculation:
    """测试成本计算"""

    def test_calculate_cost_gpt35(self):
        """测试 GPT-3.5 成本计算"""
        cost = calculate_cost("gpt-3.5-turbo", input_tokens=1000, output_tokens=1000)

        # GPT-3.5: $0.0005 input + $0.0015 output per 1K tokens
        # 1000 tokens each = $0.0005 + $0.0015 = $0.0020
        expected_cost = 0.002

        assert abs(float(cost) - expected_cost) < 0.0001

    def test_calculate_cost_gpt4(self):
        """测试 GPT-4 成本计算"""
        cost = calculate_cost("gpt-4", input_tokens=1000, output_tokens=1000)

        # GPT-4: $0.03 input + $0.06 output per 1K tokens
        # 1000 tokens each = $0.03 + $0.06 = $0.09
        expected_cost = 0.09

        assert abs(float(cost) - expected_cost) < 0.001

    def test_calculate_cost_zero_tokens(self):
        """测试零 token 的成本"""
        cost = calculate_cost("gpt-3.5-turbo", input_tokens=0, output_tokens=0)

        assert float(cost) == 0

    def test_calculate_cost_unknown_model(self):
        """测试未知模型使用默认定价"""
        cost = calculate_cost("unknown-model", input_tokens=1000, output_tokens=1000)

        # 应该使用 GPT-3.5 的默认定价
        gpt35_cost = calculate_cost("gpt-3.5-turbo", input_tokens=1000, output_tokens=1000)

        assert cost == gpt35_cost


@pytest.mark.unit
class TestCallTrackerHandler:
    """测试调用追踪器"""

    def test_callback_handler_initialization(self, test_db: Session, test_user: User):
        """测试回调处理器初始化"""
        handler = CallTrackerHandler(
            db=test_db,
            user_id=test_user.id,
            input_prompt="Test prompt",
            chain_type="test_chain"
        )

        assert handler.db == test_db
        assert handler.user_id == test_user.id
        assert handler.input_prompt == "Test prompt"
        assert handler.chain_type == "test_chain"
        assert handler.call_id is not None

    @patch('app.callbacks.call_tracker.count_tokens')
    def test_callback_on_llm_end(
        self,
        mock_count_tokens,
        test_db: Session,
        test_user: User
    ):
        """测试 LLM 调用结束回调"""
        # Mock token counting
        mock_count_tokens.side_effect = [100, 200]  # input, output tokens

        handler = CallTrackerHandler(
            db=test_db,
            user_id=test_user.id,
            input_prompt="Test prompt",
            model_name="gpt-3.5-turbo"
        )

        # Mock LLM result
        mock_result = MagicMock()
        mock_generation = MagicMock()
        mock_generation.text = "Generated output"
        mock_result.generations = [[mock_generation]]

        # 触发回调
        handler.on_llm_start({}, ["Test prompt"])
        handler.on_llm_end(mock_result)

        # 验证数据库记录
        call = test_db.query(ModelCall).filter(
            ModelCall.id == handler.call_id
        ).first()

        assert call is not None
        assert call.user_id == test_user.id
        assert call.status == CallStatus.SUCCESS
        assert call.input_tokens == 100
        assert call.output_tokens == 200
        assert call.total_tokens == 300

    def test_callback_on_llm_error(
        self,
        test_db: Session,
        test_user: User
    ):
        """测试 LLM 调用错误回调"""
        handler = CallTrackerHandler(
            db=test_db,
            user_id=test_user.id,
            input_prompt="Test prompt"
        )

        # 触发错误回调
        handler.on_llm_start({}, ["Test prompt"])
        handler.on_llm_error(Exception("Test error"))

        # 验证错误记录
        call = test_db.query(ModelCall).filter(
            ModelCall.id == handler.call_id
        ).first()

        assert call is not None
        assert call.status == CallStatus.FAILURE
        assert "Test error" in call.error_message


@pytest.mark.unit
@pytest.mark.requires_api_key
class TestLangChainIntegration:
    """测试 LangChain 集成（需要 API key）"""

    @pytest.mark.skip(reason="Requires actual API key and makes real API calls")
    def test_real_llm_call(self, test_db: Session, test_user: User, mock_openai_key):
        """测试真实 LLM 调用（跳过以避免 API 费用）"""
        from app.services.optimization_service import OptimizationService
        from app.schemas.optimization import OptimizationScenario

        result = OptimizationService.optimize_prompt(
            db=test_db,
            user_id=test_user.id,
            original_prompt="Write a blog post",
            scenario=OptimizationScenario.GENERAL
        )

        assert "optimized_content" in result
        assert "token_count" in result
        assert "estimated_cost" in result
