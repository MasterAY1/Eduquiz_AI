"""Models package — import all models so Alembic can auto-detect them."""

from app.models.user import User, RefreshToken  # noqa: F401
from app.models.document import Document, DocumentChunk  # noqa: F401
from app.models.quiz import Quiz, Question, QuizAttempt  # noqa: F401
from app.models.chat import ChatSession, ChatMessage  # noqa: F401
from app.models.prompt import AIPrompt, PromptMetric  # noqa: F401
from app.models.security_and_metrics import (  # noqa: F401
    UserQuota,
    CachedAIResponse,
    AIUsageLog,
    SystemEvent,
    AuditLog,
    ModelUsageStat,
)

__all__ = [
    "User",
    "RefreshToken",
    "Document",
    "DocumentChunk",
    "Quiz",
    "Question",
    "QuizAttempt",
    "UserQuota",
    "CachedAIResponse",
    "AIUsageLog",
    "SystemEvent",
    "AuditLog",
    "ModelUsageStat",
    "AIPrompt",
    "PromptMetric",
]
