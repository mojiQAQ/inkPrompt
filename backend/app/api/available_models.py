"""Available model list API."""
import os
import re
from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.core.config import get_settings, normalize_openai_base_url

router = APIRouter(prefix="/models", tags=["models"])


class AvailableModelItem(BaseModel):
    name: str
    base_url: str
    model: str
    params: dict = Field(default_factory=dict)


class AvailableModelsResponse(BaseModel):
    items: list[AvailableModelItem]
    max_concurrent_test_models: int


_PLACEHOLDER_PATTERN = re.compile(r"^\{\{([A-Z0-9_]+)\}\}$")


def _resolve_placeholder(value: str, settings) -> str | None:
    match = _PLACEHOLDER_PATTERN.match(value)
    if not match:
        return value

    key = match.group(1)
    mapping = {
        "OPENAI_API_KEY": settings.openai_api_key,
        "OPENAI_API_BASE": settings.openai_api_base,
        "DEFAULT_MODEL": settings.default_model,
        "ANTHROPIC_API_KEY": os.getenv("ANTHROPIC_API_KEY"),
        "GOOGLE_API_KEY": os.getenv("GOOGLE_API_KEY"),
    }
    return mapping.get(key)


@router.get("", response_model=AvailableModelsResponse)
async def list_available_models() -> AvailableModelsResponse:
    settings = get_settings()
    items: list[AvailableModelItem] = []

    for raw_item in settings.AVAILABLE_MODELS:
        resolved_item: dict = {}
        for key, value in raw_item.items():
            resolved_item[key] = _resolve_placeholder(value, settings) if isinstance(value, str) else value

        if not resolved_item.get("name") or not resolved_item.get("base_url") or not resolved_item.get("model"):
            continue

        if not resolved_item.get("api_key"):
            continue

        resolved_item["base_url"] = normalize_openai_base_url(resolved_item.get("base_url"))
        items.append(AvailableModelItem.model_validate({
            key: value for key, value in resolved_item.items() if key != "api_key"
        }))

    if not items and settings.openai_api_key:
        items.append(
            AvailableModelItem(
                name="当前配置模型",
                base_url=normalize_openai_base_url(settings.openai_api_base) or settings.openai_api_base,
                model=settings.default_model,
            )
        )

    return AvailableModelsResponse(
        items=items,
        max_concurrent_test_models=settings.MAX_CONCURRENT_TEST_MODELS,
    )
