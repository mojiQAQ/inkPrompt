"""Model call API endpoints."""
import math
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from decimal import Decimal

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.model_call import ModelCall, CallStatus
from app.schemas.model_call import (
    ModelCallResponse,
    ModelCallListResponse,
    ModelCallStatsResponse
)

router = APIRouter(prefix="/model-calls", tags=["model-calls"])


@router.get("", response_model=ModelCallListResponse)
async def list_model_calls(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    status: Optional[CallStatus] = Query(None, description="调用状态筛选"),
    model_name: Optional[str] = Query(None, description="模型名称筛选"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> ModelCallListResponse:
    """
    List model calls with pagination and filtering.

    Args:
        page: Page number
        page_size: Items per page
        status: Filter by call status
        model_name: Filter by model name
        current_user: Current authenticated user
        db: Database session

    Returns:
        ModelCallListResponse: Paginated list of model calls
    """
    # Build query
    query = db.query(ModelCall).filter(ModelCall.user_id == current_user.id)

    # Apply filters
    if status:
        query = query.filter(ModelCall.status == status)
    if model_name:
        query = query.filter(ModelCall.model_name == model_name)

    # Get total count
    total = query.count()

    # Apply pagination
    offset = (page - 1) * page_size
    calls = query.order_by(desc(ModelCall.created_at)).offset(offset).limit(page_size).all()

    # Calculate total pages
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return ModelCallListResponse(
        items=[ModelCallResponse.model_validate(call) for call in calls],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/stats", response_model=ModelCallStatsResponse)
async def get_model_call_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> ModelCallStatsResponse:
    """
    Get statistics for model calls.

    Args:
        current_user: Current authenticated user
        db: Database session

    Returns:
        ModelCallStatsResponse: Call statistics
    """
    # Query for statistics
    stats = db.query(
        func.count(ModelCall.id).label('total_calls'),
        func.sum(
            func.case(
                (ModelCall.status == CallStatus.SUCCESS, 1),
                else_=0
            )
        ).label('successful_calls'),
        func.sum(
            func.case(
                (ModelCall.status != CallStatus.SUCCESS, 1),
                else_=0
            )
        ).label('failed_calls'),
        func.sum(ModelCall.total_tokens).label('total_tokens'),
        func.sum(ModelCall.estimated_cost).label('total_cost'),
        func.avg(ModelCall.response_time_ms).label('avg_response_time')
    ).filter(ModelCall.user_id == current_user.id).first()

    return ModelCallStatsResponse(
        total_calls=stats.total_calls or 0,
        successful_calls=stats.successful_calls or 0,
        failed_calls=stats.failed_calls or 0,
        total_tokens=stats.total_tokens or 0,
        total_cost=Decimal(str(stats.total_cost or 0)),
        average_response_time_ms=float(stats.avg_response_time) if stats.avg_response_time else None
    )


@router.get("/{call_id}", response_model=ModelCallResponse)
async def get_model_call(
    call_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> ModelCallResponse:
    """
    Get a specific model call by ID.

    Args:
        call_id: Call ID
        current_user: Current authenticated user
        db: Database session

    Returns:
        ModelCallResponse: Call details
    """
    call = db.query(ModelCall).filter(
        ModelCall.id == call_id,
        ModelCall.user_id == current_user.id
    ).first()

    if not call:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model call not found"
        )

    return ModelCallResponse.model_validate(call)
