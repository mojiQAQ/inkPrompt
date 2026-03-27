"""LangChain configuration and setup."""
import os
from typing import Optional
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

from app.core.config import normalize_openai_base_url

# Load environment variables
load_dotenv()


class LangChainConfig:
    """Configuration manager for LangChain."""

    def __init__(self):
        """Initialize LangChain configuration."""
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.api_base = normalize_openai_base_url(
            os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")
        )
        self.default_model = os.getenv("DEFAULT_MODEL", "gpt-3.5-turbo")
        self.default_temperature = float(os.getenv("DEFAULT_TEMPERATURE", "0.7"))
        self.max_tokens = int(os.getenv("MAX_TOKENS_PER_REQUEST", "4000"))

        if not self.api_key:
            raise ValueError(
                "OPENAI_API_KEY environment variable is not set. "
                "Please configure it in your .env file."
            )

    def create_chat_model(
        self,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> ChatOpenAI:
        """
        Create a ChatOpenAI instance with configuration.

        Args:
            model: Model name (defaults to configured default)
            temperature: Sampling temperature (0-1)
            max_tokens: Maximum tokens in response
            **kwargs: Additional parameters for ChatOpenAI

        Returns:
            ChatOpenAI: Configured chat model instance

        Example:
            >>> config = LangChainConfig()
            >>> llm = config.create_chat_model(temperature=0.5)
        """
        return ChatOpenAI(
            model=model or self.default_model,
            temperature=temperature if temperature is not None else self.default_temperature,
            max_tokens=max_tokens or self.max_tokens,
            openai_api_key=self.api_key,
            base_url=self.api_base,
            **kwargs
        )

    def validate_config(self) -> dict:
        """
        Validate configuration and return status.

        Returns:
            dict: Configuration status with validation results
        """
        validation = {
            "api_key_set": bool(self.api_key),
            "api_key_prefix": self.api_key[:7] + "..." if self.api_key else None,
            "api_base": self.api_base,
            "default_model": self.default_model,
            "default_temperature": self.default_temperature,
            "max_tokens": self.max_tokens,
            "valid": bool(self.api_key)
        }
        return validation


# Global config instance
_config: Optional[LangChainConfig] = None


def get_langchain_config() -> LangChainConfig:
    """
    Get the global LangChain configuration instance.

    Returns:
        LangChainConfig: Global configuration instance

    Raises:
        ValueError: If configuration is invalid
    """
    global _config
    if _config is None:
        _config = LangChainConfig()
    return _config


def create_chat_model(
    model: Optional[str] = None,
    temperature: Optional[float] = None,
    max_tokens: Optional[int] = None,
    **kwargs
) -> ChatOpenAI:
    """
    Convenience function to create a chat model.

    Args:
        model: Model name (defaults to configured default)
        temperature: Sampling temperature (0-1)
        max_tokens: Maximum tokens in response
        **kwargs: Additional parameters for ChatOpenAI

    Returns:
        ChatOpenAI: Configured chat model instance

    Example:
        >>> from app.core.langchain_config import create_chat_model
        >>> llm = create_chat_model(temperature=0.3)
        >>> response = llm.invoke("Hello, world!")
    """
    config = get_langchain_config()
    return config.create_chat_model(
        model=model,
        temperature=temperature,
        max_tokens=max_tokens,
        **kwargs
    )
