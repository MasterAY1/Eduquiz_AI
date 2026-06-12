import json
import re
import time
from typing import List

from openai import AsyncOpenAI

from app.ai.base import AIProvider, DocumentAnalysis, EvaluationResult, QuizQuestion

from app.schemas.ai import (
    DocumentAnalysisSchema,
    EvaluationResultSchema,
    QuizQuestionSchema,
)
from app.utils.errors import AIProviderError
from app.utils.logger import get_logger

logger = get_logger(__name__)


class DeepSeekProvider(AIProvider):
    """AI provider backed by DeepSeek via the OpenAI-compatible API."""

    def __init__(self, api_key: str, model_name: str = "deepseek-chat") -> None:
        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://api.deepseek.com",
        )
        self.friendly_name = model_name
        self.api_model_name = self._map_model_name(model_name)
        self.model = self.api_model_name

    def _map_model_name(self, friendly_name: str) -> str:
        mapping = {
            "deepseek-v4": "deepseek-chat",
        }
        return mapping.get(friendly_name, friendly_name)

    # ── Helpers ────────────────────────────────────────────────────────────────

    async def _call(self, prompt: str) -> str:
        """Send a chat completion request and return the content string."""
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.4,
        )
        return response.choices[0].message.content or ""

    def _extract_json(self, text: str):
        """Strip markdown fences and parse JSON."""
        text = re.sub(r"```json\s*", "", text)
        text = re.sub(r"```\s*", "", text)
        return json.loads(text.strip())

    async def _generate_with_retry(
        self,
        prompt: str,
        schema_cls,
        operation_name: str,
        document_id: str | None = None,
        quiz_id: str | None = None,
        prompt_id: str | None = None,
        prompt_version: int | None = None,
        prompt_variant: str | None = None,
    ):
        """
        Send a request to DeepSeek with progressive retry logic and schema validation.
        """
        provider_name = "deepseek"
        model_name = self.friendly_name

        # Check Cache Layer first
        from app.utils.ai_cache import (
            generate_cache_key,
            get_cached_response,
            set_cached_response,
        )
        cache_key_data = {
            "provider": provider_name,
            "model": model_name,
            "prompt": prompt,
            "schema": schema_cls.__name__ if schema_cls else None,
        }
        cache_key = generate_cache_key(cache_key_data)
        cached_text = await get_cached_response(cache_key)
        
        if cached_text:
            try:
                # Log success with zero token metrics for cache hit
                from app.utils.ai_logger import log_ai_usage
                await log_ai_usage(
                    operation=operation_name,
                    provider=provider_name,
                    model=model_name,
                    input_tokens=0,
                    output_tokens=0,
                    response_time_ms=0,
                    status="success",
                    document_id=document_id,
                    quiz_id=quiz_id,
                    prompt_id=prompt_id,
                    prompt_version=prompt_version,
                    prompt_variant=prompt_variant,
                )
                parsed_json = json.loads(cached_text)
                if schema_cls:
                    if isinstance(parsed_json, list):
                        from pydantic import TypeAdapter
                        return TypeAdapter(schema_cls).validate_python(parsed_json)
                    return schema_cls.model_validate(parsed_json)
                return parsed_json
            except Exception as exc:
                logger.warning(f"Cache validation failure: {exc}. Re-running LLM.")

        current_prompt = prompt
        last_error = None
        start_time = time.perf_counter()

        for attempt in range(1, 4):
            logger.info(f"DeepSeek {operation_name} call - Attempt {attempt}/3")
            try:
                # API request call
                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=[{"role": "user", "content": current_prompt}],
                    response_format={"type": "json_object"},
                    temperature=0.4,
                )
                raw_text = response.choices[0].message.content or ""

                # Extract token metrics
                prompt_tokens = 0
                output_tokens = 0
                if hasattr(response, "usage") and response.usage:
                    prompt_tokens = response.usage.prompt_tokens
                    output_tokens = response.usage.completion_tokens

                # Extract JSON and parse
                parsed_json = self._extract_json(raw_text)

                # DeepSeek json_object format may wrap arrays inside generic objects
                if schema_cls and isinstance(parsed_json, dict) and issubclass(type(schema_cls), type(List)):
                    # Extract list wrapper key if needed
                    if "questions" in parsed_json:
                        parsed_json = parsed_json["questions"]
                    elif "quiz" in parsed_json:
                        parsed_json = parsed_json["quiz"]
                    elif len(parsed_json) == 1 and isinstance(list(parsed_json.values())[0], list):
                        parsed_json = list(parsed_json.values())[0]

                # Schema validation
                if schema_cls:
                    if isinstance(parsed_json, list):
                        from pydantic import TypeAdapter
                        validated_data = TypeAdapter(schema_cls).validate_python(parsed_json)
                    else:
                        validated_data = schema_cls.model_validate(parsed_json)
                else:
                    validated_data = parsed_json

                duration_ms = int((time.perf_counter() - start_time) * 1000)

                # Save response to cache
                await set_cached_response(
                    cache_key=cache_key,
                    prompt=prompt,
                    response_text=json.dumps(parsed_json),
                    provider=provider_name,
                    model=model_name,
                )

                # Log metrics to DB
                from app.utils.ai_logger import log_ai_usage
                await log_ai_usage(
                    operation=operation_name,
                    provider=provider_name,
                    model=model_name,
                    input_tokens=prompt_tokens,
                    output_tokens=output_tokens,
                    response_time_ms=duration_ms,
                    status="success",
                    document_id=document_id,
                    quiz_id=quiz_id,
                    prompt_id=prompt_id,
                    prompt_version=prompt_version,
                    prompt_variant=prompt_variant,
                )

                return validated_data

            except Exception as exc:
                last_error = str(exc)
                logger.warning(f"DeepSeek attempt {attempt} failed: {exc}")

                # Progressive prompt adjustment
                if attempt == 1:
                    current_prompt = (
                        f"{prompt}\n\n"
                        f"CRITICAL CORRECTION (PREVIOUS ATTEMPT FAILED):\n"
                        f"Your output failed validation with this error: {last_error}\n"
                        f"Please fix your formatting and verify all required JSON fields are present."
                    )
                elif attempt == 2:
                    current_prompt = (
                        f"{prompt}\n\n"
                        f"CRITICAL CORRECTION (SECOND ATTEMPT FAILED):\n"
                        f"Your response is still failing. Error: {last_error}\n"
                        f"REMINDER: Return ONLY a raw JSON structure matching the schema. No markdown wrapping, no conversations."
                    )

        # Log final failure
        duration_ms = int((time.perf_counter() - start_time) * 1000)
        from app.utils.ai_logger import log_ai_usage
        await log_ai_usage(
            operation=operation_name,
            provider=provider_name,
            model=model_name,
            input_tokens=0,
            output_tokens=0,
            response_time_ms=duration_ms,
            status="error",
            error_message=last_error,
            document_id=document_id,
            quiz_id=quiz_id,
            prompt_id=prompt_id,
            prompt_version=prompt_version,
            prompt_variant=prompt_variant,
        )

        # Record system health event
        from app.database import AsyncSessionLocal
        from app.models.security_and_metrics import SystemEvent
        async with AsyncSessionLocal() as session:
            event = SystemEvent(
                event_type="failed_ai_call",
                severity="error",
                message=f"DeepSeek failed 3 attempts for {operation_name}: {last_error}",
                details={"operation": operation_name, "error": last_error},
            )
            session.add(event)
            await session.commit()

        raise AIProviderError(f"AI response failed schema validation: {last_error}")

    # ── AIProvider interface ───────────────────────────────────────────────────

    async def analyze_document(
        self, text: str, level: str = "sss", language: str = "en"
    ) -> DocumentAnalysis:
        """Analyse document content and extract subject, level, topics, summary."""
        from app.database import AsyncSessionLocal
        from app.services.prompt_service import prompt_service
        
        async with AsyncSessionLocal() as db:
            prompt, p_id, p_ver, p_var = await prompt_service.get_formatted_prompt(
                db=db,
                category="document_analysis",
                target_model=self.friendly_name,
                language=language,
                text=text,
            )

        try:
            data = await self._generate_with_retry(
                prompt=prompt,
                schema_cls=DocumentAnalysisSchema,
                operation_name="document_analysis",
                prompt_id=p_id,
                prompt_version=p_ver,
                prompt_variant=p_var,
            )
            return DocumentAnalysis(
                subject=data.subject,
                detected_level=data.detected_level,
                topics=data.topics,
                subtopics=data.subtopics,
                summary=data.summary,
            )
        except Exception as exc:
            logger.error(f"DeepSeek analyze_document failed: {exc}")
            raise AIProviderError(f"Document analysis failed: {exc}") from exc

    async def generate_quiz(
        self, context: str, settings: dict, language: str = "en"
    ) -> list[QuizQuestion]:
        """Generate quiz questions from context chunks."""
        from app.database import AsyncSessionLocal
        from app.services.prompt_service import prompt_service
        
        style_desc = {
            "waec": "WAEC/WASSCE standard format",
            "jamb": "JAMB UTME standard format",
            "neco": "NECO standard format",
            "bece": "Junior Secondary BECE format",
            "university_theory": "Nigerian University Theory Exam Format",
        }.get(settings.get("exam_style", "standard"), "Standard general practice quiz")

        category = "university_theory_generation" if settings.get("exam_style") == "university_theory" else "quiz_generation"
        async with AsyncSessionLocal() as db:
            prompt, p_id, p_ver, p_var = await prompt_service.get_formatted_prompt(
                db=db,
                category=category,
                target_model=self.friendly_name,
                context=context,
                language=language,
                style_desc=style_desc,
                **settings
            )

        try:
            items = await self._generate_with_retry(
                prompt=prompt,
                schema_cls=List[QuizQuestionSchema],
                operation_name="quiz_generation",
                prompt_id=p_id,
                prompt_version=p_ver,
                prompt_variant=p_var,
            )
            questions: list[QuizQuestion] = []
            for q in items:
                questions.append(
                    QuizQuestion(
                        question_text=q.question_text,
                        question_type=q.question_type,
                        options=q.options,
                        correct_answer=q.correct_answer,
                        explanation=q.explanation,
                        topic_reference=q.topic_reference,
                        difficulty=q.difficulty,
                        marks=q.marks,
                        section=q.section,
                    )
                )
            return questions
        except Exception as exc:
            logger.error(f"DeepSeek generate_quiz failed: {exc}")
            raise AIProviderError(f"Quiz generation failed: {exc}") from exc

    async def embed(self, texts: list[str]) -> list[list[float]]:
        """DeepSeek does not provide embeddings — delegate to GeminiEmbedder."""
        from app.rag.embedder import GeminiEmbedder
        return await GeminiEmbedder().embed(texts)

    async def evaluate_answers(
        self, questions: list, answers: dict
    ) -> EvaluationResult:
        """Basic evaluation using DeepSeek chat."""
        lines = []
        for i, q in enumerate(questions):
            student_ans = answers.get(str(q["id"]), "No answer")
            lines.append(
                f"Q{i + 1} [ID:{q['id']}]: {q['text']}\n"
                f"  Correct: {q['correct']}\n"
                f"  Student: {student_ans}"
            )
        q_block = "\n".join(lines)
        prompt = (
            f"Evaluate quiz answers and return JSON:\n{q_block}\n"
            'Return: {"per_question": {"<id>": {"correct": bool, "feedback": "str"}}, '
            '"overall_evaluation": "str"}'
        )
        try:
            data = await self._generate_with_retry(
                prompt=prompt,
                schema_cls=EvaluationResultSchema,
                operation_name="answer_evaluation",
            )
            return EvaluationResult(
                per_question={
                    k: {"correct": v.correct, "feedback": v.feedback}
                    for k, v in data.per_question.items()
                },
                overall_evaluation=data.overall_evaluation,
            )
        except Exception as exc:
            logger.warning(f"DeepSeek evaluate_answers failed: {exc}")
            return EvaluationResult(
                per_question={},
                overall_evaluation="Quiz completed. Keep studying!",
            )
    async def chat(
        self,
        messages: list[dict],
        context: str = "",
    ) -> str:
        from app.database import AsyncSessionLocal
        from app.services.prompt_service import prompt_service
        
        async with AsyncSessionLocal() as db:
            system_instruction, p_id, p_ver, p_var = await prompt_service.get_formatted_prompt(
                db=db,
                category="tutor_chat",
                target_model=self.friendly_name,
                language="en",
                context=context
            )

        ds_messages = [{"role": "system", "content": system_instruction}]
        for msg in messages:
            role = "assistant" if msg["role"] == "ai" else "user"
            ds_messages.append({"role": role, "content": msg["content"]})

        start_time = time.perf_counter()
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=ds_messages,
                temperature=0.6,
            )
            
            prompt_tokens = response.usage.prompt_tokens if response.usage else 0
            output_tokens = response.usage.completion_tokens if response.usage else 0
            duration_ms = int((time.perf_counter() - start_time) * 1000)
            
            from app.utils.ai_logger import log_ai_usage
            await log_ai_usage(
                operation="chat",
                provider="deepseek",
                model=self.friendly_name,
                input_tokens=prompt_tokens,
                output_tokens=output_tokens,
                response_time_ms=duration_ms,
                status="success",
                prompt_id=p_id,
                prompt_version=p_ver,
                prompt_variant=p_var,
            )
            
            return response.choices[0].message.content or ""
        except Exception as e:
            duration_ms = int((time.perf_counter() - start_time) * 1000)
            from app.utils.ai_logger import log_ai_usage
            await log_ai_usage(
                operation="chat",
                provider="deepseek",
                model=self.friendly_name,
                input_tokens=0,
                output_tokens=0,
                response_time_ms=duration_ms,
                status="error",
                error_message=str(e),
                prompt_id=p_id,
                prompt_version=p_ver,
                prompt_variant=p_var,
            )
            logger.error(f"DeepSeek chat failed: {e}")
            raise AIProviderError(f"Chat failed: {e}")
