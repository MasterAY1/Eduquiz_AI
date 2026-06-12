"""QuotaManager service to track and enforce RPM, TPM, and RPD limits for AI models."""

import asyncio
import uuid
from collections import deque
from datetime import date, datetime, timedelta
from typing import Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.security_and_metrics import ModelUsageStat
from app.utils.logger import get_logger

logger = get_logger(__name__)


class QuotaManager:
    """Manages short-term (RPM/TPM) and daily (RPD) limits across AI models."""

    # Standard model configurations
    LIMITS = {
        "gemini-3.1-flash-lite": {
            "rpm": 15,
            "tpm": 250000,
            "rpd": 500,
        },
        "gemini-2.5-flash": {
            "rpm": 15,
            "tpm": 250000,
            "rpd": 5000,
        },
        "gemini-3.5-flash": {
            "rpm": 15,
            "tpm": 250000,
            "rpd": 5000,
        },
        "deepseek-v4": {
            "rpm": 60,
            "tpm": 1000000,
            "rpd": 100000,
        },
    }

    def __init__(self):
        # In-memory history for sliding window: model_name -> list of (timestamp, token_count)
        self.history: Dict[str, List[tuple]] = {}
        
        # Daily aggregated usage: model_name -> {"requests": count, "tokens": count}
        self.daily_usage: Dict[str, Dict[str, int]] = {
            m: {"requests": 0, "tokens": 0} for m in self.LIMITS
        }
        
        # Active reservations (currently running API calls): model_name -> {"requests": count, "tokens": count}
        self.reservations: Dict[str, Dict[str, int]] = {
            m: {"requests": 0, "tokens": 0} for m in self.LIMITS
        }
        
        # Active cool-downs: model_name -> datetime until cool-down expires
        self.cool_downs: Dict[str, datetime] = {}
        
        # Lock to ensure thread/async safety during bootstrapping
        self._lock = asyncio.Lock()
        self._bootstrapped = False

    async def ensure_bootstrapped(self, db: AsyncSession) -> None:
        """Loads today's usage statistics from the database to initialize daily quotas."""
        if self._bootstrapped:
            return

        async with self._lock:
            if self._bootstrapped:
                return

            try:
                today = date.today()
                stmt = select(ModelUsageStat).where(ModelUsageStat.date == today)
                result = await db.execute(stmt)
                stats = result.scalars().all()

                # Reset de daily usage cache
                for m in self.LIMITS:
                    self.daily_usage[m] = {"requests": 0, "tokens": 0}

                for stat in stats:
                    if stat.model_name in self.daily_usage:
                        self.daily_usage[stat.model_name]["requests"] = stat.requests_used
                        self.daily_usage[stat.model_name]["tokens"] = stat.tokens_used
                        logger.info(
                            f"Bootstrapped quota for {stat.model_name}: "
                            f"{stat.requests_used}/{self.LIMITS[stat.model_name]['rpd']} RPD used today."
                        )

                self._bootstrapped = True
                logger.info("QuotaManager bootstrapped successfully.")
            except Exception as e:
                logger.error(f"Failed to bootstrap QuotaManager from database: {e}")
                # Fallback to empty daily usage so we don't crash
                self._bootstrapped = True

    def can_use_model(self, model_name: str, estimated_tokens: int = 5000) -> bool:
        """Determines if a model is currently within its RPM, TPM, and RPD limits."""
        if model_name not in self.LIMITS:
            return False

        now = datetime.now()
        
        # 1. Check if model is cooling down
        if model_name in self.cool_downs:
            if now < self.cool_downs[model_name]:
                logger.info(f"Model {model_name} is in cool-down until {self.cool_downs[model_name]}")
                return False
            else:
                del self.cool_downs[model_name]

        limits = self.LIMITS[model_name]

        # 2. Check Daily RPD
        used_today = self.daily_usage.get(model_name, {}).get("requests", 0)
        reserved_requests = self.reservations.get(model_name, {}).get("requests", 0)
        
        if used_today + reserved_requests + 1 > limits["rpd"]:
            logger.info(f"Model {model_name} daily RPD quota exceeded ({used_today} used, {limits['rpd']} limit)")
            return False

        # 3. Clean history & sliding window check (RPM, TPM)
        cutoff = now.timestamp() - 60.0
        history = self.history.setdefault(model_name, [])
        self.history[model_name] = [item for item in history if item[0] > cutoff]

        active_requests = len(self.history[model_name])
        active_tokens = sum(item[1] for item in self.history[model_name])

        reserved_tokens = self.reservations.get(model_name, {}).get("tokens", 0)

        # Check RPM
        if active_requests + reserved_requests + 1 > limits["rpm"]:
            logger.info(f"Model {model_name} RPM limit exceeded ({active_requests + reserved_requests + 1}/{limits['rpm']})")
            return False

        # Check TPM
        if active_tokens + reserved_tokens + estimated_tokens > limits["tpm"]:
            logger.info(f"Model {model_name} TPM limit exceeded ({active_tokens + reserved_tokens + estimated_tokens}/{limits['tpm']})")
            return False

        return True

    def get_best_model(self, tier: int, estimated_tokens: int = 5000) -> str:
        """Determines the best model to route the request to based on the task's tier,
        estimated tokens, and current remaining quotas.
        """
        if tier == 1:
            candidates = ["gemini-3.1-flash-lite", "deepseek-v4"]
        elif tier == 2:
            candidates = ["gemini-2.5-flash", "gemini-3.1-flash-lite", "deepseek-v4"]
        elif tier == 3:
            candidates = ["gemini-3.5-flash", "deepseek-v4"]
        else:
            candidates = ["gemini-3.1-flash-lite", "deepseek-v4"]

        for model in candidates:
            if self.can_use_model(model, estimated_tokens):
                return model

        # Absolute fallback if everything is rate limited
        logger.warning("All configured model quotas are exhausted or cooling down. Falling back to deepseek-v4.")
        return "deepseek-v4"

    def reserve_quota(self, model_name: str, estimated_tokens: int = 5000) -> None:
        """Temporarily blocks quota before an API request executes to prevent race conditions."""
        if model_name not in self.LIMITS:
            return
        self.reservations[model_name]["requests"] += 1
        self.reservations[model_name]["tokens"] += estimated_tokens
        logger.debug(f"Reserved quota for {model_name}: +1 request, +{estimated_tokens} tokens")

    def release_quota(self, model_name: str, estimated_tokens: int = 5000) -> None:
        """Releases the reserved quota (e.g. if the request fails immediately or finished)."""
        if model_name not in self.LIMITS:
            return
        self.reservations[model_name]["requests"] = max(0, self.reservations[model_name]["requests"] - 1)
        self.reservations[model_name]["tokens"] = max(0, self.reservations[model_name]["tokens"] - estimated_tokens)
        logger.debug(f"Released reserved quota for {model_name}: -1 request, -{estimated_tokens} tokens")

    def set_cool_down(self, model_name: str, seconds: int = 30) -> None:
        """Sets a cool-down window for a model that has failed or hit rate limits."""
        if model_name not in self.LIMITS:
            return
        self.cool_downs[model_name] = datetime.now() + timedelta(seconds=seconds)
        logger.warning(f"Placed model {model_name} in cool-down for {seconds} seconds.")

    async def record_usage(
        self,
        model_name: str,
        estimated_tokens: int,
        actual_tokens: int,
        response_time_ms: int,
        success: bool,
        db: AsyncSession,
    ) -> None:
        """Logs the final consumption values, clears reservations, and persists metrics to the DB."""
        # 1. Release the reserved buffer first
        self.release_quota(model_name, estimated_tokens)

        if model_name not in self.LIMITS:
            return

        now = datetime.now()

        # 2. Update local in-memory sliding window history
        # Only add to history if it was successfully sent/run. If failed, add with 0 tokens to track RPM.
        tokens_in_window = actual_tokens if success else 0
        self.history.setdefault(model_name, []).append((now.timestamp(), tokens_in_window))

        # 3. Update local daily tracking
        self.daily_usage[model_name]["requests"] += 1
        self.daily_usage[model_name]["tokens"] += actual_tokens

        # 4. Update stats in the database
        try:
            today = date.today()
            stmt = select(ModelUsageStat).where(
                ModelUsageStat.model_name == model_name,
                ModelUsageStat.date == today
            )
            result = await db.execute(stmt)
            stat = result.scalar_one_or_none()

            if stat is None:
                stat = ModelUsageStat(
                    id=uuid.uuid4(),
                    model_name=model_name,
                    date=today,
                    requests_used=1,
                    tokens_used=actual_tokens,
                    successful_requests=1 if success else 0,
                    failed_requests=0 if success else 1,
                    average_response_time_ms=float(response_time_ms) if success else 0.0,
                )
                db.add(stat)
            else:
                stat.requests_used += 1
                stat.tokens_used += actual_tokens
                if success:
                    stat.successful_requests += 1
                    # Update running average response time
                    total_success = stat.successful_requests
                    if total_success > 1:
                        prev_sum = stat.average_response_time_ms * (total_success - 1)
                        stat.average_response_time_ms = (prev_sum + response_time_ms) / total_success
                    else:
                        stat.average_response_time_ms = float(response_time_ms)
                else:
                    stat.failed_requests += 1

            await db.commit()
            logger.debug(f"Persisted usage stat for {model_name} to database.")
        except Exception as e:
            logger.error(f"Failed to persist model usage stats to database: {e}")
            await db.rollback()

    def get_remaining_quota(self, model_name: str) -> dict:
        """Returns the capacity remaining for RPM, TPM, and RPD metrics."""
        if model_name not in self.LIMITS:
            return {}

        limits = self.LIMITS[model_name]
        now = datetime.now()
        cutoff = now.timestamp() - 60.0

        # Current sliding window requests/tokens
        history = [item for item in self.history.get(model_name, []) if item[0] > cutoff]
        active_requests = len(history)
        active_tokens = sum(item[1] for item in history)

        # Reservations
        res_requests = self.reservations.get(model_name, {}).get("requests", 0)
        res_tokens = self.reservations.get(model_name, {}).get("tokens", 0)

        # Daily used
        used_today = self.daily_usage.get(model_name, {}).get("requests", 0)

        remaining_rpm = max(0, limits["rpm"] - (active_requests + res_requests))
        remaining_tpm = max(0, limits["tpm"] - (active_tokens + res_tokens))
        remaining_rpd = max(0, limits["rpd"] - (used_today + res_requests))

        status = "healthy"
        if model_name in self.cool_downs:
            status = "cooling_down"
        elif remaining_rpd == 0:
            status = "exhausted"

        return {
            "status": status,
            "remaining_rpm": remaining_rpm,
            "remaining_tpm": remaining_tpm,
            "remaining_rpd": remaining_rpd,
            "used_today": used_today,
            "limit_rpd": limits["rpd"],
        }

    def reset_in_memory_quotas(self) -> None:
        """Resets all sliding windows and local tracking statistics (useful for tests/admin resets)."""
        self.history.clear()
        self.cool_downs.clear()
        for m in self.LIMITS:
            self.daily_usage[m] = {"requests": 0, "tokens": 0}
            self.reservations[m] = {"requests": 0, "tokens": 0}
        logger.info("In-memory quotas reset.")


# Singleton instance
quota_manager = QuotaManager()
