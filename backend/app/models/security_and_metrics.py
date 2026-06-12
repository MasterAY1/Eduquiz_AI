"""Database models for security, metrics, audits, caching, and quotas."""

import uuid
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserQuota(Base):
    """Tracks and limits daily usage quotas for users based on tiers."""

    __tablename__ = "user_quotas"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    plan_type: Mapped[str] = mapped_column(String(50), default="free", server_default="free")
    uploads_used_today: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    quizzes_generated_today: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    ai_requests_today: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    last_reset_date: Mapped[date] = mapped_column(Date, default=func.current_date(), server_default=func.current_date())

    # Relationships
    user = relationship("User")


class CachedAIResponse(Base):
    """AI response cache to save tokens and costs on identical requests."""

    __tablename__ = "cached_ai_responses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    cache_key: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    prompt_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    response_text: Mapped[str] = mapped_column(Text, nullable=False)
    provider: Mapped[str] = mapped_column(String(100), nullable=False)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )


class AIUsageLog(Base):
    """Detailed LLM and embedding request tracking logs."""

    __tablename__ = "ai_usage_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    request_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), index=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    document_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    quiz_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("quizzes.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    provider: Mapped[str] = mapped_column(String(100), nullable=False)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    operation: Mapped[str] = mapped_column(String(100), nullable=False)
    
    prompt_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("ai_prompts.id", ondelete="SET NULL"))
    prompt_version: Mapped[int | None] = mapped_column(Integer)
    prompt_variant: Mapped[str | None] = mapped_column(String(50))
    input_tokens: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    output_tokens: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    estimated_cost: Mapped[float] = mapped_column(
        Numeric(10, 6), default=0.0, server_default="0.000000"
    )
    response_time_ms: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    user = relationship("User")
    document = relationship("Document")
    quiz = relationship("Quiz")


class SystemEvent(Base):
    """Aggregate health monitor for logging exceptions, failures, and security events."""

    __tablename__ = "system_events"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    event_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    severity: Mapped[str] = mapped_column(String(50), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    details: Mapped[dict | None] = mapped_column(JSONB)
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    user = relationship("User")


class AuditLog(Base):
    """Compliance audit trail logging user authentication and core CRUD events."""

    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    ip_address: Mapped[str | None] = mapped_column(String(100))
    user_agent: Mapped[str | None] = mapped_column(Text)
    details: Mapped[dict | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    user = relationship("User")


class ModelUsageStat(Base):
    """Tracks cumulative daily request counts and metrics for individual AI models."""

    __tablename__ = "model_usage_stats"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    model_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    date: Mapped[date] = mapped_column(
        Date, default=func.current_date(), server_default=func.current_date(), index=True
    )
    requests_used: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    tokens_used: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    successful_requests: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    failed_requests: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    average_response_time_ms: Mapped[float] = mapped_column(
        Numeric(12, 2), default=0.0, server_default="0.00"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        UniqueConstraint("model_name", "date", name="uq_model_name_date"),
    )
