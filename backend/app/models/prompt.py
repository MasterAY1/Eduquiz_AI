import uuid
from sqlalchemy import String, Boolean, Integer, Text, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base
from app.models.base import TimestampMixin


class AIPrompt(Base, TimestampMixin):
    __tablename__ = "ai_prompts"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), index=True)
    category: Mapped[str] = mapped_column(String(100), index=True)
    target_model: Mapped[str | None] = mapped_column(String(100)) # Specific model or generic
    version: Mapped[int] = mapped_column(Integer, default=1)
    variant: Mapped[str] = mapped_column(String(50), default='control') # 'A', 'B', 'control'
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)
    template: Mapped[str] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text)
    
    metrics = relationship("PromptMetric", back_populates="prompt", uselist=False, cascade="all, delete-orphan")


class PromptMetric(Base, TimestampMixin):
    __tablename__ = "prompt_metrics"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    prompt_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("ai_prompts.id", ondelete="CASCADE"), unique=True)
    
    total_uses: Mapped[int] = mapped_column(Integer, default=0)
    success_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=0.0)
    avg_quiz_score: Mapped[float] = mapped_column(Numeric(5, 2), default=0.0)
    avg_completion_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=0.0)
    avg_response_time: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0)
    user_rating: Mapped[float] = mapped_column(Numeric(3, 2), default=0.0)

    prompt = relationship("AIPrompt", back_populates="metrics")
