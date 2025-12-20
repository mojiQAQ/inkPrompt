"""Token counting utilities using tiktoken."""
import tiktoken
from typing import Optional


def count_tokens(text: str, model: str = "gpt-3.5-turbo") -> int:
    """
    Count tokens in text using tiktoken.

    Args:
        text: Text to count tokens for
        model: Model name to use for encoding (default: gpt-3.5-turbo)

    Returns:
        int: Number of tokens

    Note:
        Token count is approximate and may differ slightly from actual API usage.
        Different models may use different encodings.
    """
    try:
        encoding = tiktoken.encoding_for_model(model)
    except KeyError:
        # Fallback to cl100k_base encoding (used by gpt-3.5-turbo and gpt-4)
        encoding = tiktoken.get_encoding("cl100k_base")

    tokens = encoding.encode(text)
    return len(tokens)


def estimate_tokens(text: str) -> int:
    """
    Quick estimation of token count (1 token ≈ 4 characters for English).

    This is faster but less accurate than count_tokens().
    Use for rough estimates or when performance is critical.

    Args:
        text: Text to estimate tokens for

    Returns:
        int: Estimated number of tokens
    """
    # Rough estimation: 1 token ≈ 4 characters for English
    # For Chinese/Japanese, 1 token ≈ 2 characters
    # We use a conservative estimate
    return max(1, len(text) // 3)
