"""AI usage logging and cost calculation utilities."""

import uuid

from app.config import get_settings
from app.database import AsyncSessionLocal
from app.models.security_and_metrics import AIUsageLog
from app.utils.context import request_id_ctx, user_id_ctx
from app.utils.logger import get_logger

logger = get_logger(__name__)


def calculate_cost(provider: str, model: str, input_tokens: int, output_tokens: int) -> float:
    """Calculate the estimated financial cost of an LLM query in USD."""
    # Pricing per 1,000,000 tokens as of mid-2026
    if provider == "gemini":
        # Gemini 2.0 Flash: input $0.075 / 1M, output $0.30 / 1M
        return (input_tokens * 0.075 / 1000000.0) + (output_tokens * 0.30 / 1000000.0)
    elif provider == "deepseek":
        # DeepSeek Chat V3: input $0.14 / 1M, output $0.28 / 1M
        return (input_tokens * 0.14 / 1000000.0) + (output_tokens * 0.28 / 1000000.0)
    return 0.0


async def log_ai_usage(
    operation: str,
    provider: str,
    model: str,
    input_tokens: int,
    output_tokens: int,
    response_time_ms: int,
    status: str,
    error_message: str | None = None,
    document_id: uuid.UUID | str | None = None,
    quiz_id: uuid.UUID | str | None = None,
    prompt_id: uuid.UUID | str | None = None,
    prompt_version: int | None = None,
    prompt_variant: str | None = None,
) -> None:
    """Write an execution record to the ai_usage_logs database table."""
    async with AsyncSessionLocal() as db:
        try:
            # Parse document and quiz IDs safely if passed as strings
            doc_uuid = uuid.UUID(str(document_id)) if document_id else None
            quiz_uuid = uuid.UUID(str(quiz_id)) if quiz_id else None
            prompt_uuid = uuid.UUID(str(prompt_id)) if prompt_id else None

            cost = calculate_cost(provider, model, input_tokens, output_tokens)

            log_entry = AIUsageLog(
                request_id=request_id_ctx.get(),
                user_id=user_id_ctx.get(),
                document_id=doc_uuid,
                quiz_id=quiz_uuid,
                provider=provider,
                model=model,
                operation=operation,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                estimated_cost=cost,
                response_time_ms=response_time_ms,
                status=status,
                error_message=error_message,
                prompt_id=prompt_uuid,
                prompt_version=prompt_version,
                prompt_variant=prompt_variant,
            )
            db.add(log_entry)
            await db.commit()
            
            # Record daily quota request count increment
            user_id_val = user_id_ctx.get()
            if user_id_val:
                from sqlalchemy import select
                from app.models.security_and_metrics import UserQuota
                
                quota_result = await db.execute(
                    select(UserQuota).where(UserQuota.user_id == user_id_val)
                )
                quota = quota_result.scalar_one_or_none()
                if quota:
                    quota.ai_requests_today += 1
                    await db.commit()

        except Exception as exc:
            logger.warning(f"Failed to record AI usage log in database: {exc}")
