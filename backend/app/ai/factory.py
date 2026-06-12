"""AI provider factory with automatic fallback."""

from app.ai.base import AIProvider
from app.config import get_settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

_provider_instance: AIProvider | None = None


def get_ai_provider() -> AIProvider:
    """
    Return the singleton ModelRouter AI provider instance.
    """
    global _provider_instance
    if _provider_instance is not None:
        return _provider_instance

    settings = get_settings()
    if not settings.GEMINI_API_KEY and not settings.DEEPSEEK_API_KEY:
        raise RuntimeError(
            "No AI provider configured. "
            "Set GEMINI_API_KEY or DEEPSEEK_API_KEY in your .env file."
        )

    from app.ai.router import ModelRouter
    _provider_instance = ModelRouter()
    logger.info("AI provider initialized: ModelRouter (quota-aware dynamic router)")
    return _provider_instance


_instances: dict[str, AIProvider] = {}


def get_provider_for_model(model_name: str) -> AIProvider:
    """
    Get or create a cached AIProvider instance for a specific model name.
    """
    global _instances
    if model_name in _instances:
        return _instances[model_name]

    settings = get_settings()

    if model_name.startswith("gemini"):
        if not settings.GEMINI_API_KEY:
            raise RuntimeError(f"Cannot initialize {model_name}: GEMINI_API_KEY is missing.")
        from app.ai.providers.gemini import GeminiProvider
        provider = GeminiProvider(api_key=settings.GEMINI_API_KEY, model_name=model_name)
    elif model_name.startswith("deepseek"):
        if not settings.DEEPSEEK_API_KEY:
            raise RuntimeError(f"Cannot initialize {model_name}: DEEPSEEK_API_KEY is missing.")
        from app.ai.providers.deepseek import DeepSeekProvider
        provider = DeepSeekProvider(api_key=settings.DEEPSEEK_API_KEY, model_name=model_name)
    else:
        raise ValueError(f"Unknown model name: {model_name}")

    _instances[model_name] = provider
    return provider


async def get_ai_provider_dep() -> AIProvider:
    """FastAPI dependency wrapper for get_ai_provider()."""
    return get_ai_provider()
