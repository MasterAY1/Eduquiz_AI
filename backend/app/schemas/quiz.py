"""Pydantic v2 schemas for quiz endpoints."""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator


class QuizGenerateRequest(BaseModel):
    """Payload for POST /quizzes/generate."""

    document_id: uuid.UUID
    title: Optional[str] = None  # auto-generated from document title if omitted
    exam_style: str = "standard"  # waec | neco | jamb | bece | standard
    difficulty: str = "medium"  # easy | medium | hard
    question_count: int = 10
    question_types: list[str] = ["mcq"]  # mcq | fill_blank | true_false | theory
    time_limit_minutes: Optional[int] = None

    @field_validator("question_count")
    @classmethod
    def validate_count(cls, v: int) -> int:
        if v not in (5, 10, 20, 30, 50):
            # Allow any count but clamp to a reasonable maximum
            if v < 1:
                raise ValueError("question_count must be at least 1.")
            if v > 100:
                raise ValueError("question_count cannot exceed 100.")
        return v

    @field_validator("exam_style")
    @classmethod
    def validate_exam_style(cls, v: str) -> str:
        valid = {"waec", "neco", "jamb", "bece", "standard", "university_theory"}
        if v not in valid:
            raise ValueError(f"exam_style must be one of {valid}.")
        return v

    @field_validator("difficulty")
    @classmethod
    def validate_difficulty(cls, v: str) -> str:
        valid = {"easy", "medium", "hard"}
        if v not in valid:
            raise ValueError(f"difficulty must be one of {valid}.")
        return v


class QuestionResponse(BaseModel):
    """A single question — correct_answer and explanation are NOT included (use AttemptResult)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    question_number: int
    question_text: str
    question_type: str
    options: Optional[list] = None
    topic_reference: Optional[str] = None
    marks: float


class QuizSummaryResponse(BaseModel):
    """Lightweight quiz card for listing."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    exam_style: str
    difficulty: str
    question_count: int
    subject: Optional[str] = None
    time_limit_minutes: Optional[int] = None
    created_at: datetime


class QuizResponse(BaseModel):
    """Full quiz with all questions (answers hidden)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    document_id: Optional[uuid.UUID] = None
    title: str
    quiz_mode: str
    exam_style: str
    subject: Optional[str] = None
    difficulty: str
    question_count: int
    time_limit_minutes: Optional[int] = None
    language: str
    model_used: Optional[str] = None
    created_at: datetime
    questions: list[QuestionResponse] = []


class StartAttemptResponse(BaseModel):
    """Returned when a quiz attempt is started."""

    attempt_id: uuid.UUID
    quiz_id: uuid.UUID
    started_at: datetime
    time_limit_minutes: Optional[int] = None


class SubmitAttemptRequest(BaseModel):
    """Payload for POST /quizzes/attempt/{id}/submit."""

    answers: dict[str, str]  # {question_id: student_answer}
    time_taken_seconds: Optional[int] = None


class QuestionResult(BaseModel):
    """Per-question result including correct answer and feedback."""

    question_id: uuid.UUID
    question_text: str
    question_type: str
    user_answer: Optional[str] = None
    correct_answer: str
    explanation: Optional[str] = None
    is_correct: bool
    marks_earned: float
    max_marks: float


class AttemptResultResponse(BaseModel):
    """Complete result of a submitted quiz attempt."""

    attempt_id: uuid.UUID
    quiz_id: uuid.UUID
    score: float
    max_score: float
    percentage: float
    time_taken_seconds: Optional[int] = None
    xp_earned: int
    overall_evaluation: Optional[str] = None
    questions: list[QuestionResult] = []
