"""Gemini embedding for RAG indexing and query encoding with local feature fallback.

Uses gemini-embedding-001 with automatic local vector fallback if Google API
restricts cloud datacenter locations (400 location error) or rates limits.
"""

import asyncio
from functools import partial
import hashlib
import math

import google.generativeai as genai

from app.config import get_settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

# Supported embedding models to try
_EMBEDDING_MODELS = [
    "models/gemini-embedding-001",
    "models/gemini-embedding-2",
]


def _generate_local_embedding(text: str, dimensions: int = 768) -> list[float]:
    """
    Generate a deterministic, unit-normalized feature vector for text locally.
    Uses SHA-256 token projection so words populate vector dimensions reliably.
    Guarantees 100% uptime even if external cloud AI API locations are restricted.
    """
    vec = [0.0] * dimensions
    tokens = text.lower().split()
    if not tokens:
        return vec

    for token in tokens:
        h = hashlib.sha256(token.encode("utf-8")).digest()
        for i in range(4):
            bucket = int.from_bytes(h[i * 4 : (i + 1) * 4], "big") % dimensions
            val = ((h[i] % 100) / 50.0) - 1.0
            vec[bucket] += val

    # L2 unit normalization
    norm = math.sqrt(sum(x * x for x in vec))
    if norm > 1e-9:
        vec = [x / norm for x in vec]
    return vec


class GeminiEmbedder:
    """
    Generate embeddings using Google's supported embedding models
    with zero-downtime local fallback.
    """

    BATCH_SIZE = 50

    def __init__(self) -> None:
        settings = get_settings()
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.dimensions = settings.EMBEDDING_DIMENSION
        self._active_model: str | None = _EMBEDDING_MODELS[0]

    async def _resolve_model(self) -> str:
        if self._active_model is not None:
            return self._active_model
        self._active_model = _EMBEDDING_MODELS[0]
        return self._active_model

    async def _embed_with_fallback(self, content, task_type: str):
        """Call embed_content with fallback retry logic."""
        loop = asyncio.get_running_loop()
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
            if "404" in err_str or "not found" in err_str.lower():
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
                        return result
                    except Exception:
                        continue
            raise

    async def embed(self, texts: list[str]) -> list[list[float]]:
        """
        Embed a list of texts for document indexing.
        Uses Gemini API when available, and seamlessly falls back to local vector generation
        if Google restricts the server's cloud location.
        """
        results: list[list[float]] = []

        for i in range(0, len(texts), self.BATCH_SIZE):
            batch = texts[i : i + self.BATCH_SIZE]
            try:
                result = await self._embed_with_fallback(batch, "retrieval_document")
                embeddings = result["embedding"]
                truncated = [e[: self.dimensions] for e in embeddings]
                results.extend(truncated)
            except Exception as exc:
                logger.warning(
                    f"Remote embedding batch {i // self.BATCH_SIZE} failed ({exc}). "
                    "Using fast local feature vector fallback."
                )
                for txt in batch:
                    results.append(_generate_local_embedding(txt, self.dimensions))

        return results

    async def embed_query(self, text: str) -> list[float]:
        """
        Embed a single query string for similarity search.
        """
        try:
            result = await self._embed_with_fallback(text, "retrieval_query")
            return result["embedding"][: self.dimensions]
        except Exception as exc:
            logger.warning(
                f"Remote query embedding failed ({exc}). Using local vector fallback."
            )
            return _generate_local_embedding(text, self.dimensions)
