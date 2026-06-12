"""Google Gemini AI provider implementation."""

import asyncio
import json
import re
import time
from functools import partial
from typing import List

import google.generativeai as genai

from app.ai.base import AIProvider, DocumentAnalysis, EvaluationResult, QuizQuestion

from app.schemas.ai import (
    DocumentAnalysisSchema,
    EvaluationResultSchema,
    QuizQuestionSchema,
)
from app.utils.errors import AIProviderError
from app.utils.logger import get_logger

logger = get_logger(__name__)


class GeminiProvider(AIProvider):
    """AI provider backed by Google Gemini 2.0 Flash."""

    def __init__(self, api_key: str, model_name: str = "gemini-2.0-flash") -> None:
        genai.configure(api_key=api_key)
        
        # Map friendly model names to actual API models if needed
        self.friendly_name = model_name
        self.api_model_name = model_name
        
        self.model = genai.GenerativeModel(
            self.api_model_name,
            generation_config=genai.GenerationConfig(
                temperature=0.4,
                response_mime_type="application/json",
            ),
        )



    # ── Helpers ────────────────────────────────────────────────────────────────

    def _extract_json(self, text: str):
        """Strip markdown fences if present, then parse JSON."""
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
        Send a request to Gemini with progressive retry logic and schema validation.
        
        Attempts:
          Attempt 1: Original prompt.
          Attempt 2: Original prompt + corrective details about schema/JSON failure.
          Attempt 3: Original prompt + strict JSON warning and constraints review.
        """
        provider_name = "gemini"
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
            logger.info(f"Gemini {operation_name} call - Attempt {attempt}/3")
            try:
                # Native asynchronous SDK call
                response = await self.model.generate_content_async(current_prompt)
                raw_text = response.text

                # Extract token metrics
                prompt_tokens = 0
                output_tokens = 0
                if hasattr(response, "usage_metadata") and response.usage_metadata:
                    prompt_tokens = response.usage_metadata.prompt_token_count
                    output_tokens = response.usage_metadata.candidates_token_count

                # Extract JSON and parse
                parsed_json = self._extract_json(raw_text)

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
                logger.warning(f"Gemini attempt {attempt} failed: {exc}")

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
                message=f"Gemini failed 3 attempts for {operation_name}: {last_error}",
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
            logger.error(f"Gemini analyze_document failed: {exc}")
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
            logger.error(f"Gemini generate_quiz failed: {exc}")
            raise AIProviderError(f"Quiz generation failed: {exc}") from exc

    async def embed(self, texts: list[str]) -> list[list[float]]:
        """Delegate to GeminiEmbedder."""
        from app.rag.embedder import GeminiEmbedder
        embedder = GeminiEmbedder()
        return await embedder.embed(texts)

    async def evaluate_answers(
        self, questions: list, answers: dict
    ) -> EvaluationResult:
        """AI-powered per-question evaluation with feedback."""
        lines = []
        for i, q in enumerate(questions):
            student_ans = answers.get(str(q["id"]), "No answer")
            lines.append(
                f"Q{i + 1} [ID:{q['id']}]: {q['text']}\n"
                f"  Correct: {q['correct']}\n"
                f"  Student: {student_ans}"
            )
        q_block = "\n".join(lines)

        prompt = f"""You are an educational AI evaluator for Nigerian students.

Evaluate the following quiz answers and return a JSON object.

{q_block}

Return this JSON structure:
{{
  "per_question": {{
    "<question_id>": {{
      "correct": true,
      "feedback": "Brief explanation of whether the answer is correct and why."
    }}
  }},
  "overall_evaluation": "2-3 sentence overall feedback on the student's performance, areas of strength, and areas for improvement."
}}

Return ONLY the JSON object."""

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
            logger.warning(f"Gemini evaluate_answers failed: {exc}. Using default.")
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
                language="en",  # TODO: extract language from messages or user context
                context=context
            )

        # Initialize chat model with system instruction
        chat_model = genai.GenerativeModel(
            self.api_model_name,
            system_instruction=system_instruction,
            generation_config=genai.GenerationConfig(temperature=0.6),
        )

        # Convert standardized messages to Gemini format
        gemini_messages = []
        for msg in messages:
            role = "model" if msg["role"] == "ai" else "user"
            gemini_messages.append({
                "role": role,
                "parts": [msg["content"]]
            })

        start_time = time.perf_counter()
        try:
            # We use an executor because generate_content is synchronous in the Python SDK
            # But we can also use generate_content_async! Wait, gemini supports generate_content_async for chat too.
            # But since it's already using run_in_executor, I'll keep it or change it to generate_content_async.
            response = await chat_model.generate_content_async(gemini_messages)
            
            prompt_tokens = response.usage_metadata.prompt_token_count if response.usage_metadata else 0
            output_tokens = response.usage_metadata.candidates_token_count if response.usage_metadata else 0
            duration_ms = int((time.perf_counter() - start_time) * 1000)
            
            from app.utils.ai_logger import log_ai_usage
            await log_ai_usage(
                operation="chat",
                provider="gemini",
                model=self.friendly_name,
                input_tokens=prompt_tokens,
                output_tokens=output_tokens,
                response_time_ms=duration_ms,
                status="success",
                prompt_id=p_id,
                prompt_version=p_ver,
                prompt_variant=p_var,
            )
            
            return response.text
        except Exception as e:
            duration_ms = int((time.perf_counter() - start_time) * 1000)
            from app.utils.ai_logger import log_ai_usage
            await log_ai_usage(
                operation="chat",
                provider="gemini",
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
            logger.error(f"Gemini chat failed: {e}")
            raise AIProviderError(f"Chat failed: {e}")
