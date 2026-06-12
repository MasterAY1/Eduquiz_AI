"""Quiz, Question, and QuizAttempt ORM models."""

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import TimestampMixin


class Quiz(Base, TimestampMixin):
    """A generated quiz linked to a document and user."""

    __tablename__ = "quizzes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    document_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="SET NULL"),
        index=True,
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    quiz_mode: Mapped[str] = mapped_column(String(50), default="practice")
    exam_style: Mapped[str] = mapped_column(String(50), default="standard")
    subject: Mapped[str | None] = mapped_column(String(200))
    difficulty: Mapped[str] = mapped_column(String(20), default="medium")
    question_count: Mapped[int] = mapped_column(Integer, nullable=False)
    time_limit_minutes: Mapped[int | None] = mapped_column(Integer)
    is_randomized: Mapped[bool] = mapped_column(Boolean, default=False)
    language: Mapped[str] = mapped_column(String(10), default="en")
    model_used: Mapped[str | None] = mapped_column(String(100))
    
    prompt_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("ai_prompts.id", ondelete="SET NULL"))
    prompt_version: Mapped[int | None] = mapped_column(Integer)
    prompt_variant: Mapped[str | None] = mapped_column(String(50))

    # Relationships
    questions: Mapped[list["Question"]] = relationship(
        "Question",
        back_populates="quiz",
        order_by="Question.question_number",
        cascade="all, delete-orphan",
    )
    attempts: Mapped[list["QuizAttempt"]] = relationship(
        "QuizAttempt", back_populates="quiz"
    )
    document: Mapped["Document | None"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Document", back_populates="quizzes"
    )
    user: Mapped["User"] = relationship("User")  # type: ignore[name-defined]  # noqa: F821


class Question(Base):
    """A single question belonging to a quiz."""

    __tablename__ = "questions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    quiz_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("quizzes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    question_number: Mapped[int] = mapped_column(Integer, nullable=False)
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    question_type: Mapped[str] = mapped_column(
        String(30), nullable=False
    )  # mcq, fill_blank, true_false, matching, theory
    options: Mapped[dict | None] = mapped_column(JSONB)  # [{key, text}, ...]
    correct_answer: Mapped[str] = mapped_column(Text, nullable=False)
    explanation: Mapped[str | None] = mapped_column(Text)
    topic_reference: Mapped[str | None] = mapped_column(String(300))
    difficulty: Mapped[str | None] = mapped_column(String(20))
    marks: Mapped[float] = mapped_column(Numeric(5, 2), default=1.0)
    section: Mapped[str | None] = mapped_column(String(10))

    # Relationships
    quiz: Mapped["Quiz"] = relationship("Quiz", back_populates="questions")


class QuizAttempt(Base):
    """A student's attempt at a quiz."""

    __tablename__ = "quiz_attempts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    quiz_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("quizzes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    attempt_number: Mapped[int] = mapped_column(Integer, default=1)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    time_taken_seconds: Mapped[int | None] = mapped_column(Integer)
    score: Mapped[float | None] = mapped_column(Numeric(6, 2))
    max_score: Mapped[float | None] = mapped_column(Numeric(6, 2))
    percentage: Mapped[float | None] = mapped_column(Numeric(5, 2))
    answers: Mapped[dict | None] = mapped_column(JSONB)  # {question_id: answer}
    ai_feedback: Mapped[dict | None] = mapped_column(
        JSONB
    )  # {question_id: {correct, feedback}}
    overall_evaluation: Mapped[str | None] = mapped_column(Text)
    xp_earned: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    quiz: Mapped["Quiz"] = relationship("Quiz", back_populates="attempts")
    user: Mapped["User"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "User", back_populates="quiz_attempts"
    )
