"""Prompt optimization service (Simplified version)."""
from sqlalchemy.orm import Session
from app.core.langchain_config import create_chat_model
from app.callbacks.call_tracker import create_call_tracker
from app.schemas.optimization import OptimizationScenario
from app.utils.token_counter import count_tokens


OPTIMIZATION_TEMPLATES = {
    OptimizationScenario.GENERAL: """You are an expert prompt engineer. Optimize the following prompt to be clearer, more effective, and better structured.

Original prompt:
{prompt}

Provide an optimized version that:
1. Is clearer and more specific
2. Has better structure
3. Gives better results from LLMs

Return only the optimized prompt without explanation.""",

    OptimizationScenario.CONTENT_CREATION: """Optimize this content creation prompt to generate higher quality, more engaging content.

Original:
{prompt}

Make it more creative and inspiring.""",

    OptimizationScenario.CODE_GENERATION: """Optimize this code generation prompt for better code quality and clarity.

Original:
{prompt}

Make it produce cleaner, more maintainable code.""",

    OptimizationScenario.DATA_ANALYSIS: """Optimize this data analysis prompt for more accurate and insightful analysis.

Original:
{prompt}

Make it more precise and analytical, focusing on:
1. Clear data requirements
2. Specific analysis methods
3. Expected output format

Return only the optimized prompt.""",

    OptimizationScenario.CONVERSATION: """Optimize this conversational prompt for more natural and engaging interactions.

Original:
{prompt}

Make it more conversational and user-friendly, with:
1. Clear context setting
2. Natural dialogue flow
3. Appropriate tone and personality

Return only the optimized prompt.""",
}


class OptimizationService:
    """Service for prompt optimization using LLM."""

    @staticmethod
    def optimize_prompt(
        db: Session,
        user_id: str,
        original_prompt: str,
        scenario: OptimizationScenario
    ) -> dict:
        """
        Optimize a prompt using LLM.

        Args:
            db: Database session
            user_id: User ID for tracking
            original_prompt: The prompt to optimize
            scenario: Optimization scenario

        Returns:
            dict: Optimization result with optimized_content, suggestions, etc.
        """
        # Get template
        template = OPTIMIZATION_TEMPLATES.get(
            scenario,
            OPTIMIZATION_TEMPLATES[OptimizationScenario.GENERAL]
        )

        # Create optimization prompt
        optimization_prompt = template.format(prompt=original_prompt)

        # Create LLM with callback
        callback = create_call_tracker(
            db, user_id,
            chain_type="prompt_optimization",
            scenario=scenario.value
        )
        llm = create_chat_model(temperature=0.7, callbacks=[callback])

        # Call LLM
        response = llm.invoke(optimization_prompt)
        optimized_content = response.content

        # Count tokens
        token_count = count_tokens(optimized_content)

        # Generate suggestions (simple version)
        suggestions = [
            "The optimized version is more structured",
            "Added clarity to improve LLM understanding",
            "Improved specificity for better results"
        ]

        return {
            "optimized_content": optimized_content,
            "suggestions": suggestions,
            "token_count": token_count,
            "estimated_cost": 0.001  # Simplified cost
        }
