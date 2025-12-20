"""Optimization API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.optimization import OptimizationRequest, OptimizationResponse
from app.services.optimization_service import OptimizationService
from app.services.prompt_service import PromptService

router = APIRouter(prefix="/prompts", tags=["optimization"])


@router.post("/{prompt_id}/optimize", response_model=OptimizationResponse)
async def optimize_prompt(
    prompt_id: str,
    request: OptimizationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> OptimizationResponse:
    """
    Optimize a prompt using LLM.

    Args:
        prompt_id: Prompt ID to optimize
        request: Optimization request data
        current_user: Current authenticated user
        db: Database session

    Returns:
        OptimizationResponse: Optimization result
    """
    # Get prompt
    prompt = PromptService.get_prompt(db, prompt_id, current_user.id)
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )

    # Optimize
    try:
        result = OptimizationService.optimize_prompt(
            db=db,
            user_id=current_user.id,
            original_prompt=prompt.content,
            scenario=request.scenario
        )
        return OptimizationResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Optimization failed: {str(e)}"
        )
