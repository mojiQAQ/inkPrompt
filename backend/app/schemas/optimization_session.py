"""Optimization session schemas."""
from datetime import datetime
from typing import Optional, Dict, List

from pydantic import BaseModel, Field


class OptimizeSuggestion(BaseModel):
    """Single optimization suggestion question."""
    question: str
    options: List[str] = Field(default_factory=list)


class OptimizationRoundBase(BaseModel):
    """Base optimization round schema."""
    round_number: int
    user_idea: Optional[str] = None
    selected_suggestions: Optional[Dict[str, List[str]]] = None
    optimized_content: str
    suggestions: List[OptimizeSuggestion] = Field(default_factory=list)
    domain_analysis: str = ""
    version_id: Optional[str] = None


class OptimizationRoundResponse(OptimizationRoundBase):
    """Optimization round response schema."""
    id: str
    session_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class OptimizationSessionResponse(BaseModel):
    """Optimization session response schema."""
    id: str
    prompt_id: str
    user_id: str
    rounds: List[OptimizationRoundResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
