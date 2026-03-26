"""Application configuration settings."""
import json
from pathlib import Path
from typing import Any, Dict, List

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings
from functools import lru_cache

BACKEND_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_AVAILABLE_MODELS_CONFIG_PATH = Path("app/config/available_models.json")


def load_available_models_config(config_path: str | Path) -> List[Dict[str, Any]]:
    """Load available model definitions from a JSON config file."""
    path = Path(config_path)
    if not path.is_absolute():
        path = BACKEND_ROOT / path

    if not path.exists():
        raise ValueError(f"Available models config file not found: {path}")

    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError(f"Invalid available models config JSON: {path}") from exc

    if not isinstance(payload, list):
        raise ValueError("Available models config must be a JSON array")

    normalized_items: List[Dict[str, Any]] = []
    for index, item in enumerate(payload):
        if not isinstance(item, dict):
            raise ValueError(f"Available models config item at index {index} must be an object")
        normalized_items.append(dict(item))

    return normalized_items


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    database_url: str = "sqlite:///./inkprompt.db"

    # Supabase
    supabase_url: str
    supabase_jwt_secret: str

    # OpenAI / LLM
    openai_api_key: str
    openai_api_base: str = "https://api.openai.com/v1"
    default_model: str = "gpt-4"

    # LangChain (Optional)
    langchain_tracing_v2: bool = False
    langchain_api_key: str = ""

    # Model Settings
    max_tokens_default: int = 2000
    temperature_default: float = 0.7
    model_timeout: int = 30
    rate_limit_per_user: int = 100
    MAX_CONCURRENT_TEST_MODELS: int = Field(default=5, ge=1)
    AVAILABLE_MODELS_CONFIG_PATH: str = str(DEFAULT_AVAILABLE_MODELS_CONFIG_PATH)
    AVAILABLE_MODELS: List[Dict[str, Any]] = Field(default_factory=list)

    # Application
    app_name: str = "Ink & Prompt"
    app_version: str = "0.1.0"
    debug: bool = True
    cors_origins: str = "http://localhost:3000,http://localhost:5173"

    class Config:
        env_file = ".env"
        case_sensitive = False

    @model_validator(mode="after")
    def load_available_models(self) -> "Settings":
        """Populate model list from config file unless explicitly overridden."""
        if self.AVAILABLE_MODELS:
            return self

        object.__setattr__(
            self,
            "AVAILABLE_MODELS",
            load_available_models_config(self.AVAILABLE_MODELS_CONFIG_PATH),
        )
        return self

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins string into a list."""
        return [origin.strip() for origin in self.cors_origins.split(",")]


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
