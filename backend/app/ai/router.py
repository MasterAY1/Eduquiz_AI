"""AI Model Router to dynamically route queries to different models based on quotas and tiers."""

import time
import uuid
from typing import List

from sqlalchemy import select

from app.ai.base import AIProvider, DocumentAnalysis, EvaluationResult, QuizQuestion
from app.ai.factory import get_provider_for_model
from app.database import AsyncSessionLocal
from app.models.security_and_metrics import AIUsageLog
from app.services.quota_manager import quota_manager
from app.utils.logger import get_logger

logger = get_logger(__name__)


class ModelRouter(AIProvider):
    """Orchestrates intelligent multi-model routing and automatic failover."""

    def __init__(self) -> None:
        pass

    async def _execute_with_failover(
        self,
        tier: int,
        estimated_tokens: int,
        api_call_func,
    ):
        """Helper to run a provider call with dynamic model selection and automatic fallback."""
        async with AsyncSessionLocal() as db:
            # Ensure the QuotaManager is bootstrapped with today's metrics
            try:
                await quota_manager.ensure_bootstrapped(db)
            except Exception as bootstrap_exc:
                logger.warning(f"Router: QuotaManager bootstrap failed (non-fatal): {bootstrap_exc}")

            # Determine candidates based on the task tier escalation rules
            if tier == 1:
                # Tier 1 (Lite): Try Gemini Lite first, then fall back directly to DeepSeek V4
                candidates = ["gemini-3.1-flash-lite", "deepseek-v4"]
            elif tier == 2:
                # Tier 2 (Assessment): Try Gemini 2.5, then Gemini Lite, then DeepSeek V4
                candidates = ["gemini-2.5-flash", "gemini-3.1-flash-lite", "deepseek-v4"]
            elif tier == 3:
                # Tier 3 (Reasoning/Tutor): Try Gemini 3.5, then fall back directly to DeepSeek V4
                candidates = ["gemini-3.5-flash", "deepseek-v4"]
            else:
                candidates = ["gemini-3.1-flash-lite", "deepseek-v4"]

            last_error = None
            routed_model = None

            for model in candidates:
                if not quota_manager.can_use_model(model, estimated_tokens):
                    logger.info(f"Router: Skipping model {model} (quota limits or cool-down).")
                    continue

                routed_model = model
                quota_manager.reserve_quota(model, estimated_tokens)
                start_time = time.perf_counter()
                success = False
                actual_tokens = 0

                try:
                    logger.info(f"Router: Routing task (Tier {tier}) to {model}.")
                    provider = get_provider_for_model(model)
                    
                    # Execute the model request
                    result = await api_call_func(provider)
                    
                    success = True
                    duration_ms = int((time.perf_counter() - start_time) * 1000)

                    # Retrieve the exact token count from database usage log if request_id is set
                    actual_tokens = estimated_tokens
                    try:
                        from app.utils.context import request_id_ctx
                        req_id = request_id_ctx.get()
                        if req_id:
                            # Wait briefly for database logging transaction of the provider to complete
                            # (usually instant because they run concurrently on AsyncSessionLocal)
                            stmt = select(AIUsageLog).where(
                                AIUsageLog.request_id == req_id,
                                AIUsageLog.status == "success"
                            ).order_by(AIUsageLog.created_at.desc()).limit(1)
                            res = await db.execute(stmt)
                            log_entry = res.scalar_one_or_none()
                            if log_entry:
                                actual_tokens = log_entry.input_tokens + log_entry.output_tokens
                                logger.debug(f"Router: Retrieved exact tokens from log: {actual_tokens}")
                    except Exception as token_exc:
                        logger.warning(f"Router: Could not fetch precise token count: {token_exc}")

                    # Record success in QuotaManager
                    await quota_manager.record_usage(
                        model_name=model,
                        estimated_tokens=estimated_tokens,
                        actual_tokens=actual_tokens,
                        response_time_ms=duration_ms,
                        success=True,
                        db=db
                    )
                    return result

                except Exception as exc:
                    last_error = str(exc)
                    duration_ms = int((time.perf_counter() - start_time) * 1000)
                    logger.warning(
                        f"Router: Request to {model} failed. Cool-down triggered. Error: {exc}"
                    )

                    # Release quota & record failure in QuotaManager
                    await quota_manager.record_usage(
                        model_name=model,
                        estimated_tokens=estimated_tokens,
                        actual_tokens=0,
                        response_time_ms=duration_ms,
                        success=False,
                        db=db
                    )
                    # Set 30 seconds cool-down
                    quota_manager.set_cool_down(model, 30)

            # If all candidates fail
            raise RuntimeError(
                f"All candidate models for Tier {tier} failed or were rate limited. Last error: {last_error}"
            )

    # ── AIProvider Interface ───────────────────────────────────────────────────

    async def analyze_document(
        self, text: str, level: str = "sss", language: str = "en"
    ) -> DocumentAnalysis:
        """Route document analysis to Tier 1 candidates."""
        async def call(provider):
            return await provider.analyze_document(text, level, language)

        return await self._execute_with_failover(
            tier=1,
            estimated_tokens=4000,
            api_call_func=call,
        )

    async def generate_quiz(
        self, context: str, settings: dict, language: str = "en"
    ) -> List[QuizQuestion]:
        """Route quiz generation to Tier 2 candidates."""
        async def call(provider):
            return await provider.generate_quiz(context, settings, language)

        return await self._execute_with_failover(
            tier=2,
            estimated_tokens=8000,
            api_call_func=call,
        )

    async def evaluate_answers(
        self, questions: list, answers: dict
    ) -> EvaluationResult:
        """Route answer evaluation to Tier 2 candidates."""
        async def call(provider):
            return await provider.evaluate_answers(questions, answers)

        return await self._execute_with_failover(
            tier=2,
            estimated_tokens=3000,
            api_call_func=call,
        )

    async def embed(self, texts: List[str]) -> List[List[float]]:
        """Embeddings run on a dedicated model; route directly to GeminiEmbedder."""
        from app.rag.embedder import GeminiEmbedder
        embedder = GeminiEmbedder()
        return await embedder.embed(texts)

    @property
    def name(self) -> str:
        return "ModelRouter"
    async def chat(
        self,
        messages: list[dict],
        context: str = "",
    ) -> str:
        """Route a chat completion request."""
        # Estimate tokens roughly
        estimated_tokens = sum(len(m["content"]) for m in messages) // 3 + len(context) // 3
        # Chat is a Tier 3 task (Reasoning/Tutor)
        tier = 3
        
        async def call_provider(provider):
            return await provider.chat(messages, context)

        return await self._execute_with_failover(tier, estimated_tokens, call_provider)
