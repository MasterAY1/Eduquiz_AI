"""Gemini embedding for RAG indexing and query encoding.

Uses text-embedding-005 (primary) with fallback to gemini-embedding-001.
text-embedding-004 was retired in January 2026.
"""

import asyncio
from functools import partial

import google.generativeai as genai

from app.config import get_settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

# Ordered list of embedding models to try (first available wins).
_EMBEDDING_MODELS = [
    "models/text-embedding-005",       # Primary — 768 dims, English + code
    "models/gemini-embedding-001",     # Fallback — up to 3072 dims (we request 768)
]


class GeminiEmbedder:
    """
    Generate embeddings using Google's supported embedding models.

    Tries ``text-embedding-005`` first, then falls back to
    ``gemini-embedding-001``.  Uses ``retrieval_document`` task type for
    indexing and ``retrieval_query`` for query encoding, as recommended
    by Google for asymmetric retrieval.
    """

    BATCH_SIZE = 50  # Batched API calls are far more efficient

    def __init__(self) -> None:
        settings = get_settings()
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.dimensions = settings.EMBEDDING_DIMENSION
        # Will be resolved on first call so we don't block startup.
        self._active_model: str | None = None

    # ── Internal helpers ──────────────────────────────────────────────────

    async def _resolve_model(self) -> str:
        """Return the first working embedding model, caching the result."""
        if self._active_model is not None:
            return self._active_model

        loop = asyncio.get_event_loop()
        for model_name in _EMBEDDING_MODELS:
            try:
                probe = partial(
                    genai.embed_content,
                    model=model_name,
                    content="probe",
                    task_type="retrieval_document",
                    output_dimensionality=self.dimensions,
                )
                await loop.run_in_executor(None, probe)
                self._active_model = model_name
                logger.info(f"Embedding model resolved: {model_name}")
                return model_name
            except Exception as exc:
                logger.warning(
                    f"Embedding model {model_name} unavailable: {exc}"
                )
                continue

        # If nothing worked, default to the primary and let the real call
        # surface the error with full context.
        self._active_model = _EMBEDDING_MODELS[0]
        return self._active_model

    async def _embed_with_fallback(
        self,
        content,
        task_type: str,
    ):
        """Call embed_content, retrying with the next model on 404."""
        loop = asyncio.get_event_loop()
        model = await self._resolve_model()

        embed_func = partial(
            genai.embed_content,
            model=model,
            content=content,
            task_type=task_type,
            output_dimensionality=self.dimensions,
        )
        try:
            return await loop.run_in_executor(None, embed_func)
        except Exception as exc:
            err_str = str(exc)
            # If it's a model-not-found error, invalidate cache and retry once.
            if "404" in err_str or "not found" in err_str.lower():
                logger.warning(
                    f"Model {model} returned 404, trying next fallback…"
                )
                self._active_model = None  # reset cache
                for fallback in _EMBEDDING_MODELS:
                    if fallback == model:
                        continue
                    try:
                        fb_func = partial(
                            genai.embed_content,
                            model=fallback,
                            content=content,
                            task_type=task_type,
                            output_dimensionality=self.dimensions,
                        )
                        result = await loop.run_in_executor(None, fb_func)
                        self._active_model = fallback
                        logger.info(f"Fallback succeeded with {fallback}")
                        return result
                    except Exception:
                        continue
            raise

    # ── Public API ────────────────────────────────────────────────────────

    async def embed(self, texts: list[str]) -> list[list[float]]:
        """
        Embed a list of texts for document indexing.

        Args:
            texts: List of text strings to embed.

        Returns:
            List of float vectors, one per input text.
        """
        results: list[list[float]] = []

        for i in range(0, len(texts), self.BATCH_SIZE):
            batch = texts[i : i + self.BATCH_SIZE]
            try:
                result = await self._embed_with_fallback(
                    batch, "retrieval_document"
                )
                embeddings = result["embedding"]
                truncated = [e[:self.dimensions] for e in embeddings]
                results.extend(truncated)
            except Exception as exc:
                # Log event in monitoring logs
                try:
                    from app.database import AsyncSessionLocal
                    from app.models.security_and_metrics import SystemEvent

                    async with AsyncSessionLocal() as session:
                        event = SystemEvent(
                            event_type="failed_embedding",
                            severity="error",
                            message=f"Failed to generate embedding batch: {exc}",
                            details={
                                "batch_index": i // self.BATCH_SIZE,
                                "text_count": len(batch),
                            },
                        )
                        session.add(event)
                        await session.commit()
                except Exception:
                    pass  # Don't let logging failure mask the real error
                logger.error(f"Embedding batch generation failed: {exc}")
                raise

            logger.debug(
                f"Embedded batch {i // self.BATCH_SIZE + 1}: "
                f"{len(batch)} texts."
            )

        return results

    async def embed_query(self, text: str) -> list[float]:
        """
        Embed a single query string for similarity search.

        Args:
            text: Query string.

        Returns:
            Float vector for similarity search.
        """
        result = await self._embed_with_fallback(text, "retrieval_query")
        return result["embedding"][:self.dimensions]
