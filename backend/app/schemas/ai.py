"""Pydantic schemas for AI output validation."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class DocumentAnalysisSchema(BaseModel):
    """Pydantic schema validating AI document analysis results."""

    subject: str = Field(..., min_length=1)
    detected_level: str = Field(..., pattern="^(primary|jss|sss|polytechnic|col_of_edu|university)$")
    topics: List[str] = Field(default_factory=list)
    subtopics: Dict[str, List[str]] = Field(default_factory=dict)
    summary: str = Field(..., min_length=10)


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


class PerQuestionFeedbackSchema(BaseModel):
    """Pydantic schema validating per-question student feedback."""

    correct: bool
    feedback: str = Field(..., min_length=1)


class EvaluationResultSchema(BaseModel):
    """Pydantic schema validating AI answer evaluations."""

    per_question: Dict[str, PerQuestionFeedbackSchema]
    overall_evaluation: str = Field(..., min_length=10)
