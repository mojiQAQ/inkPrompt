"""Tests for application configuration loading."""
import json

import pytest

from app.core.config import Settings, load_available_models_config, normalize_openai_base_url


@pytest.mark.unit
def test_load_available_models_config_reads_json_file(tmp_path):
    config_path = tmp_path / "available_models.json"
    config_path.write_text(json.dumps([
        {
            "name": "test-model",
            "base_url": "https://example.com/v1",
            "model": "provider/test-model",
            "api_key": "{{OPENAI_API_KEY}}",
        }
    ]), encoding="utf-8")

    assert load_available_models_config(config_path) == [
        {
            "name": "test-model",
            "base_url": "https://example.com/v1",
            "model": "provider/test-model",
            "api_key": "{{OPENAI_API_KEY}}",
        }
    ]


@pytest.mark.unit
def test_settings_loads_available_models_from_config_file(tmp_path):
    config_path = tmp_path / "available_models.json"
    config_path.write_text(json.dumps([
        {
            "name": "custom-model",
            "base_url": "https://openrouter.ai/api/v1",
            "model": "openai/gpt-4.1-mini",
            "api_key": "{{OPENAI_API_KEY}}",
        }
    ]), encoding="utf-8")

    settings = Settings(
        supabase_url="http://test.local",
        supabase_jwt_secret="test-secret",
        openai_api_key="test-openai-key",
        AVAILABLE_MODELS_CONFIG_PATH=str(config_path),
    )

    assert settings.AVAILABLE_MODELS == [
        {
            "name": "custom-model",
            "base_url": "https://openrouter.ai/api/v1",
            "model": "openai/gpt-4.1-mini",
            "api_key": "{{OPENAI_API_KEY}}",
        }
    ]


@pytest.mark.unit
def test_normalize_openai_base_url_adds_v1_for_root_endpoint():
    assert normalize_openai_base_url("https://api.modelverse.cn") == "https://api.modelverse.cn/v1"
    assert normalize_openai_base_url("https://openrouter.ai/api") == "https://openrouter.ai/api/v1"


@pytest.mark.unit
def test_settings_normalizes_openai_api_base():
    settings = Settings(
        supabase_url="http://test.local",
        supabase_jwt_secret="test-secret",
        openai_api_key="test-openai-key",
        openai_api_base="https://api.modelverse.cn",
        AVAILABLE_MODELS=[],
    )

    assert settings.openai_api_base == "https://api.modelverse.cn/v1"
