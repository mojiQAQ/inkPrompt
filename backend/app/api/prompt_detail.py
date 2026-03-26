"""Prompt detail related API endpoints."""
from __future__ import annotations

import json
from typing import Any, Iterable

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.prompt import Prompt
from app.models.prompt_version import PromptVersion
from app.models.user import User
from app.schemas.optimization import ModelConfigResponse, OptimizeStreamRequest, TestStreamRequest
from app.schemas.optimization_session import OptimizationSessionResponse
from app.schemas.test_session import TestSessionResponse
from app.services.optimization_service import OptimizationService
from app.services.prompt_service import PromptService
from app.services.test_service import TestService

router = APIRouter(prefix="/prompts", tags=["prompt-detail"])


def _format_sse_data(data: Any) -> str:
    if isinstance(data, str):
        lines = data.replace("\r\n", "\n").split("\n")
        return "\n".join(f"data: {line}" for line in lines)

    payload = json.dumps(data, ensure_ascii=False, default=str)
    return f"data: {payload}"


def _sse_event(event: str, data: Any) -> str:
    payload = _format_sse_data(data)
    return f"event: {event}\n{payload}\n\n"


def _stream_response(events: Iterable[dict]) -> StreamingResponse:
    def generator():
        for item in events:
            yield _sse_event(item["type"], item.get("data", {}))

    return StreamingResponse(generator(), media_type="text/event-stream")


@router.get("/{prompt_id}/optimization/session", response_model=OptimizationSessionResponse)
@router.get("/{prompt_id}/optimize/session", response_model=OptimizationSessionResponse)
async def get_optimization_session(
    prompt_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OptimizationSessionResponse:
    prompt = PromptService.get_prompt(db, prompt_id, current_user.id)
    if not prompt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prompt not found")

    session = OptimizationService.get_session_with_rounds(db, prompt_id, current_user.id)
    if session is None:
        session = OptimizationService.get_or_create_session(db, prompt_id, current_user.id)
    return OptimizationSessionResponse.model_validate(session)


@router.post("/{prompt_id}/{version_id}/optimize/stream")
async def optimize_prompt_stream(
    prompt_id: str,
    version_id: str,
    request: OptimizeStreamRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StreamingResponse:
    prompt = PromptService.get_prompt(db, prompt_id, current_user.id)
    if not prompt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prompt not found")

    version = PromptService.get_prompt_version(db, prompt_id, version_id, current_user.id)
    if not version:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Version not found")

    events = OptimizationService.optimize_prompt_stream(
        db=db,
        user_id=current_user.id,
        prompt=prompt,
        version=version,
        user_idea=request.user_idea,
        selected_suggestions=request.selected_suggestions,
    )
    return _stream_response(events)


@router.get("/{version_id}/test/session", response_model=TestSessionResponse)
async def get_test_session(
    version_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TestSessionResponse:
    version = db.query(PromptVersion).join(Prompt).filter(
        PromptVersion.id == version_id,
        Prompt.user_id == current_user.id,
    ).first()
    if version is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Version not found")

    session = TestService.get_test_session(db, version_id, current_user.id)
    if session is None:
        session = TestService.start_test_session(db, version_id, current_user.id)
    return TestSessionResponse.model_validate(session)


@router.post("/{version_id}/test/stream")
async def test_prompt_stream(
    version_id: str,
    request: TestStreamRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StreamingResponse:
    version = db.query(PromptVersion).join(Prompt).filter(
        PromptVersion.id == version_id,
        Prompt.user_id == current_user.id,
    ).first()
    if version is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Version not found")

    model = ModelConfigResponse.model_validate(request.model)
    events = TestService.test_model_stream(
        db=db,
        user_id=current_user.id,
        prompt_version=version,
        model_config=model.model_dump(),
        user_prompt=request.user_prompt,
        continue_conversation=request.continue_conversation,
    )
    return _stream_response(events)
