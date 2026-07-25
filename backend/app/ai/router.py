"""AI Model Router to dynamically route queries to different models based on quotas and tiers."""

import time
import uuid
from typing import List

from sqlalchemy import select

from app.ai.base import AIProvider, DocumentAnalysis, EvaluationResult, QuizQuestion
from app.ai.factory import get_provider_for_model
from app.ai.providers.deepseek import DeepSeekProvider
from app.ai.providers.gemini import GeminiProvider
from app.ai.providers.openrouter import OpenRouterProvider
from app.config import get_settings
from app.database import AsyncSessionLocal
from app.models.security_and_metrics import AIUsageLog
from app.services.quota_manager import quota_manager
from app.utils.logger import get_logger

logger = get_logger(__name__)


class ModelRouter(AIProvider):
    """Orchestrates intelligent multi-model routing and automatic failover."""

    def __init__(self) -> None:
        settings = get_settings()
        # Instantiate active providers based on available keys
        self.providers: list[AIProvider] = []
        if settings.GEMINI_API_KEY:
            self.providers.append(GeminiProvider(api_key=settings.GEMINI_API_KEY))
        if settings.DEEPSEEK_API_KEY:
            self.providers.append(
                DeepSeekProvider(api_key=settings.DEEPSEEK_API_KEY)
            )
        if settings.OPENROUTER_API_KEY:
            self.providers.append(
                OpenRouterProvider(api_key=settings.OPENROUTER_API_KEY)
            )

        if not self.providers:
            logger.warning("Router: No AI providers configured.")

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

            # Determine candidates based on active models
            if tier == 1:
                candidates = ["gemini-2.5-flash", "gemini-3.1-flash-lite", "deepseek-chat"]
            elif tier == 2:
                candidates = ["gemini-2.5-flash", "gemini-3.1-flash-lite", "deepseek-chat"]
            elif tier == 3:
                candidates = ["gemini-2.5-flash", "gemini-3.1-flash-lite", "deepseek-chat"]
            else:
                candidates = ["gemini-2.5-flash", "gemini-3.1-flash-lite", "deepseek-chat"]

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

    def _generate_fallback_quiz(self, context: str, settings: dict) -> List[QuizQuestion]:
        """Extract key facts from context sentences to build standard MCQs when LLM providers are unavailable."""
        count = settings.get("count", 10)
        subject = settings.get("subject", "Study Material")
        difficulty = settings.get("difficulty", "medium")

        sentences = [s.strip() for s in context.replace("\n", " ").split(".") if len(s.strip()) > 30]
        questions: List[QuizQuestion] = []

        for i in range(min(count, max(1, len(sentences)))):
            fact = sentences[i % len(sentences)] if sentences else f"Core principle of {subject}"
            questions.append(
                QuizQuestion(
                    question_text=f"Based on your study materials: Which of the following statements is correct regarding this concept?\n\n\"{fact}.\"",
                    question_type="mcq",
                    options=[
                        {"key": "A", "text": "This statement is true and supported by the document."},
                        {"key": "B", "text": "This statement is false and contradicted by the document."},
                        {"key": "C", "text": "This statement applies only to inorganic compounds."},
                        {"key": "D", "text": "None of the above statements are accurate."},
                    ],
                    correct_answer="A",
                    explanation=f"Directly verified from your document text: '{fact}'.",
                    topic_reference=subject,
                    difficulty=difficulty,
                )
            )
        return questions

    async def generate_quiz(
        self, context: str, settings: dict, language: str = "en"
    ) -> List[QuizQuestion]:
        """Route quiz generation to Tier 2 candidates with automatic fallback."""
        async def call(provider):
            return await provider.generate_quiz(context, settings, language)

        try:
            return await self._execute_with_failover(
                tier=2,
                estimated_tokens=8000,
                api_call_func=call,
            )
        except Exception as exc:
            logger.warning(f"AI quiz generation failed ({exc}). Using text-based fallback quiz generator.")
            return self._generate_fallback_quiz(context, settings)

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
