"""Optimization schemas."""
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class OptimizationScenario(str, Enum):
    """Optimization scenario types."""
    GENERAL = "general"
    CONTENT_CREATION = "content_creation"
    CODE_GENERATION = "code_generation"
    DATA_ANALYSIS = "data_analysis"
    CONVERSATION = "conversation"


class OptimizationRequest(BaseModel):
    """Request for prompt optimization."""
    scenario: OptimizationScenario = Field(..., description="优化场景")
    custom_requirements: Optional[str] = Field(None, description="自定义要求")


class OptimizationResponse(BaseModel):
    """Response from prompt optimization."""
    optimized_content: str = Field(..., description="优化后的提示词")
    suggestions: list[str] = Field(default_factory=list, description="改进建议")
    token_count: int = Field(..., description="优化后的 token 数")
    estimated_cost: float = Field(..., description="本次优化的估算成本（USD）")
