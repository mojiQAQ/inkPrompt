"""Application configuration settings."""
from typing import List
from pydantic_settings import BaseSettings
from functools import lru_cache


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

    # Application
    app_name: str = "Ink & Prompt"
    app_version: str = "0.1.0"
    debug: bool = True
    cors_origins: str = "http://localhost:3000,http://localhost:5173"

    class Config:
        env_file = ".env"
        case_sensitive = False

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins string into a list."""
        return [origin.strip() for origin in self.cors_origins.split(",")]


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
