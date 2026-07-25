"""Pydantic schemas for AI output validation."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator


class DocumentAnalysisSchema(BaseModel):
    """Pydantic schema validating AI document analysis results."""

    subject: str = Field(..., min_length=1)
    detected_level: str = Field(..., pattern="^(primary|jss|sss|polytechnic|col_of_edu|university)$")
    topics: List[str] = Field(default_factory=list)
    subtopics: Dict[str, List[str]] = Field(default_factory=dict)
    summary: str = Field(..., min_length=10)

    @field_validator("detected_level", mode="before")
    @classmethod
    def sanitize_level(cls, v: Any) -> Any:
        if isinstance(v, str):
            v_clean = v.strip().lower()
            mapping = {
                "high school": "sss",
                "secondary": "sss",
                "college": "university",
                "undergraduate": "university",
            }
            return mapping.get(v_clean, v_clean)
        return v


class QuizQuestionSchema(BaseModel):
    """Pydantic schema validating AI-generated quiz questions."""

    question_text: str = Field(..., min_length=1)
    question_type: str = Field(..., pattern="^(mcq|fill_blank|true_false|theory)$")
    correct_answer: str = Field(..., min_length=1)
    explanation: str = Field(default="")
    topic_reference: str = Field(default="")
    difficulty: str = Field(default="medium", pattern="^(easy|medium|hard)$")
    options: Optional[List[Dict[str, Any]]] = Field(default=None)
    marks: float = Field(default=1.0)
    section: Optional[str] = Field(default=None)

    @field_validator("question_type", "difficulty", mode="before")
    @classmethod
    def sanitize_enums(cls, v: Any) -> Any:
        if isinstance(v, str):
            return v.strip().lower()
        return v


class PerQuestionFeedbackSchema(BaseModel):
    """Pydantic schema validating per-question student feedback."""

    correct: bool
    feedback: str = Field(..., min_length=1)


class EvaluationResultSchema(BaseModel):
    """Pydantic schema validating AI answer evaluations."""

    per_question: Dict[str, PerQuestionFeedbackSchema]
    overall_evaluation: str = Field(..., min_length=10)
