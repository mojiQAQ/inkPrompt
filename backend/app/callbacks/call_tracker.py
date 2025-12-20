"""Custom callback handler for tracking model calls."""
import uuid
import time
from typing import Any, Dict, List, Optional
from decimal import Decimal
from langchain.callbacks.base import BaseCallbackHandler
from langchain.schema import LLMResult
from sqlalchemy.orm import Session

from app.models.model_call import ModelCall, CallStatus, CompletionReason
from app.utils.token_counter import count_tokens


# Token pricing (per 1K tokens) - update these based on current OpenAI pricing
TOKEN_PRICING = {
    "gpt-4": {"input": 0.03, "output": 0.06},
    "gpt-4-turbo-preview": {"input": 0.01, "output": 0.03},
    "gpt-3.5-turbo": {"input": 0.0005, "output": 0.0015},
    "gpt-3.5-turbo-16k": {"input": 0.003, "output": 0.004},
}


def calculate_cost(model_name: str, input_tokens: int, output_tokens: int) -> Decimal:
    """
    Calculate estimated cost for a model call.

    Args:
        model_name: Name of the model used
        input_tokens: Number of input tokens
        output_tokens: Number of output tokens

    Returns:
        Decimal: Estimated cost in USD
    """
    # Find pricing for the model (or use default gpt-3.5-turbo pricing)
    pricing = TOKEN_PRICING.get(model_name, TOKEN_PRICING["gpt-3.5-turbo"])

    input_cost = (input_tokens / 1000) * pricing["input"]
    output_cost = (output_tokens / 1000) * pricing["output"]

    return Decimal(str(input_cost + output_cost))


class CallTrackerHandler(BaseCallbackHandler):
    """
    Callback handler that tracks LLM calls to the database.

    This handler records all LLM API calls including:
    - Input prompts and tokens
    - Output content and tokens
    - Response time and cost
    - Status and error information

    Example:
        >>> from app.callbacks.call_tracker import CallTrackerHandler
        >>> handler = CallTrackerHandler(db, user_id="user123", session_id="session456")
        >>> llm = create_chat_model(callbacks=[handler])
        >>> response = llm.invoke("Hello!")
    """

    def __init__(
        self,
        db: Session,
        user_id: str,
        session_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize the callback handler.

        Args:
            db: Database session for recording calls
            user_id: ID of the user making the call
            session_id: Optional session ID for grouping related calls
            metadata: Optional metadata to include in the call record
        """
        super().__init__()
        self.db = db
        self.user_id = user_id
        self.session_id = session_id or str(uuid.uuid4())
        self.metadata = metadata or {}

        # Tracking state
        self.call_id: Optional[str] = None
        self.start_time: Optional[float] = None
        self.input_prompt: str = ""
        self.model_name: str = ""
        self.parameters: Dict[str, Any] = {}

    def on_llm_start(
        self,
        serialized: Dict[str, Any],
        prompts: List[str],
        **kwargs: Any
    ) -> None:
        """
        Called when LLM starts running.

        Args:
            serialized: Serialized LLM configuration
            prompts: List of prompts (typically one)
            **kwargs: Additional arguments
        """
        self.call_id = str(uuid.uuid4())
        self.start_time = time.time()
        self.input_prompt = prompts[0] if prompts else ""

        # Extract model configuration
        self.model_name = serialized.get("kwargs", {}).get("model_name", "unknown")
        self.parameters = {
            "temperature": serialized.get("kwargs", {}).get("temperature"),
            "max_tokens": serialized.get("kwargs", {}).get("max_tokens"),
            "top_p": serialized.get("kwargs", {}).get("top_p"),
        }

    def on_llm_end(
        self,
        response: LLMResult,
        **kwargs: Any
    ) -> None:
        """
        Called when LLM ends running.

        Args:
            response: LLM result containing generations
            **kwargs: Additional arguments
        """
        if not self.call_id or not self.start_time:
            return

        # Calculate response time
        response_time_ms = int((time.time() - self.start_time) * 1000)

        # Extract output
        generations = response.generations[0] if response.generations else []
        output_content = generations[0].text if generations else ""

        # Count tokens
        input_tokens = count_tokens(self.input_prompt)
        output_tokens = count_tokens(output_content)
        total_tokens = input_tokens + output_tokens

        # Calculate cost
        estimated_cost = calculate_cost(self.model_name, input_tokens, output_tokens)

        # Determine completion reason
        completion_reason = CompletionReason.STOP
        if generations and hasattr(generations[0], "generation_info"):
            finish_reason = generations[0].generation_info.get("finish_reason")
            if finish_reason == "length":
                completion_reason = CompletionReason.LENGTH

        # Create call record
        model_call = ModelCall(
            id=self.call_id,
            user_id=self.user_id,
            session_id=self.session_id,
            model_name=self.model_name,
            input_prompt=self.input_prompt,
            input_tokens=input_tokens,
            output_content=output_content,
            output_tokens=output_tokens,
            total_tokens=total_tokens,
            estimated_cost=estimated_cost,
            status=CallStatus.SUCCESS,
            response_time_ms=response_time_ms,
            completion_reason=completion_reason,
            parameters=self.parameters,
            langchain_metadata=self.metadata,
        )

        try:
            self.db.add(model_call)
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            print(f"Failed to save model call: {e}")

    def on_llm_error(
        self,
        error: Exception,
        **kwargs: Any
    ) -> None:
        """
        Called when LLM encounters an error.

        Args:
            error: The exception that occurred
            **kwargs: Additional arguments
        """
        if not self.call_id or not self.start_time:
            return

        # Calculate response time
        response_time_ms = int((time.time() - self.start_time) * 1000)

        # Count input tokens
        input_tokens = count_tokens(self.input_prompt)

        # Determine status
        status = CallStatus.TIMEOUT if "timeout" in str(error).lower() else CallStatus.FAILURE

        # Create call record
        model_call = ModelCall(
            id=self.call_id,
            user_id=self.user_id,
            session_id=self.session_id,
            model_name=self.model_name,
            input_prompt=self.input_prompt,
            input_tokens=input_tokens,
            output_content=None,
            output_tokens=0,
            total_tokens=input_tokens,
            estimated_cost=Decimal("0.0"),
            status=status,
            response_time_ms=response_time_ms,
            completion_reason=CompletionReason.ERROR,
            error_message=str(error),
            parameters=self.parameters,
            langchain_metadata=self.metadata,
        )

        try:
            self.db.add(model_call)
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            print(f"Failed to save model call error: {e}")


def create_call_tracker(
    db: Session,
    user_id: str,
    session_id: Optional[str] = None,
    **metadata: Any
) -> CallTrackerHandler:
    """
    Convenience function to create a call tracker handler.

    Args:
        db: Database session
        user_id: ID of the user making the call
        session_id: Optional session ID for grouping calls
        **metadata: Additional metadata to include in call records

    Returns:
        CallTrackerHandler: Configured callback handler

    Example:
        >>> handler = create_call_tracker(db, user_id="user123", chain_type="prompt_optimization")
        >>> llm = create_chat_model(callbacks=[handler])
    """
    return CallTrackerHandler(db, user_id, session_id, metadata)
