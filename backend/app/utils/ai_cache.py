"""Caching utilities for AI provider responses to reduce API latency and cost."""

import hashlib
import json
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.security_and_metrics import CachedAIResponse
from app.utils.logger import get_logger

logger = get_logger(__name__)


def generate_cache_key(data: dict) -> str:
    """Generate a stable SHA-256 cache key from a dictionary of input params."""
    # Ensure keys are sorted to guarantee stable hashing
    serialized = json.dumps(data, sort_keys=True)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


async def get_cached_response(cache_key: str) -> str | None:
    """
    Retrieve a cached AI response if it exists and has not expired.

    Returns:
        str | None: The cached text response, or None if missing/expired.
    """
    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(
                select(CachedAIResponse).where(
                    CachedAIResponse.cache_key == cache_key
                )
            )
            cached = result.scalar_one_or_none()
            if not cached:
                return None

            # Check expiry
            if cached.expires_at < datetime.now(timezone.utc):
                # Delete expired cache record asynchronously
                await db.delete(cached)
                await db.commit()
                logger.debug(f"Cache key {cache_key} expired.")
                return None

            logger.info(f"AI response cache HIT for key: {cache_key}")
            return cached.response_text
        except Exception as exc:
            logger.warning(f"Failed to read from AI cache: {exc}")
            return None


async def set_cached_response(
    cache_key: str,
    prompt: str,
    response_text: str,
    provider: str,
    model: str,
    expire_seconds: int = 86400,
) -> None:
    """Save an AI response in the cache with an expiration duration (default 24h)."""
    async with AsyncSessionLocal() as db:
        try:
            prompt_hash = hashlib.sha256(prompt.encode("utf-8")).hexdigest()
            expires_at = datetime.now(timezone.utc) + timedelta(seconds=expire_seconds)

            # Check if key already exists (UPSERT style)
            result = await db.execute(
                select(CachedAIResponse).where(
                    CachedAIResponse.cache_key == cache_key
                )
            )
            cached = result.scalar_one_or_none()

            if cached:
                cached.response_text = response_text
                cached.expires_at = expires_at
                cached.created_at = datetime.now(timezone.utc)
            else:
                cached = CachedAIResponse(
                    cache_key=cache_key,
                    prompt_hash=prompt_hash,
                    response_text=response_text,
                    provider=provider,
                    model=model,
                    expires_at=expires_at,
                )
                db.add(cached)

            await db.commit()
            logger.debug(f"AI response cached successfully for key: {cache_key}")
        except Exception as exc:
            logger.warning(f"Failed to write to AI cache: {exc}")
