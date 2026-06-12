"""Abstract AI provider interface and shared data-transfer objects."""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional


# ── Data Transfer Objects ──────────────────────────────────────────────────────


@dataclass
class DocumentAnalysis:
    """Result from document analysis: subject, level, topics, subtopics, summary."""

    subject: str
    detected_level: str
    topics: list[str] = field(default_factory=list)
    subtopics: dict[str, list[str]] = field(default_factory=dict)
    summary: str = ""


@dataclass
class QuizQuestion:
    """A single generated quiz question with metadata."""

    question_text: str
    question_type: str  # mcq | fill_blank | true_false | theory
    correct_answer: str
    explanation: str
    topic_reference: str
    difficulty: str
    options: Optional[list[dict]] = None  # [{"key": "A", "text": "..."}, ...] or theory sub-parts
    marks: float = 1.0
    section: Optional[str] = None


@dataclass
class EvaluationResult:
    """Per-question and overall feedback from AI evaluation."""

    per_question: dict[str, dict]  # {question_id: {"correct": bool, "feedback": str}}
    overall_evaluation: str


# ── Abstract Provider ──────────────────────────────────────────────────────────


class AIProvider(ABC):
    """Interface that all AI backend providers must implement."""

    @abstractmethod
    async def analyze_document(
        self,
        text: str,
        level: str = "sss",
        language: str = "en",
    ) -> DocumentAnalysis:
        """
        Analyse educational content and return subject, level, topics, and summary.

        Args:
            text:     Extracted document text.
            level:    Hint for educational level (overridden by AI detection).
            language: Target language code ('en' or 'ha'/'yo'/'ig' for Nigerian).
        """

    @abstractmethod
    async def generate_quiz(
        self,
        context: str,
        settings: dict,
        language: str = "en",
    ) -> list[QuizQuestion]:
        """
        Generate quiz questions from retrieved context chunks.

        Args:
            context:  RAG-retrieved text relevant to the quiz request.
            settings: Quiz parameters (count, difficulty, exam_style, etc.).
            language: Target language code.
        """

    @abstractmethod
    async def embed(self, texts: list[str]) -> list[list[float]]:
        """Embed a list of strings and return 768-dim float vectors."""

    @abstractmethod
    async def evaluate_answers(
        self,
        questions: list,
        answers: dict,
    ) -> EvaluationResult:
        """
        Evaluate a student's submitted answers and return feedback.

        Args:
            questions: List of dicts with 'id', 'text', 'correct'.
            answers:   Dict mapping question_id → student_answer.
        """

    @abstractmethod
    async def chat(
        self,
        messages: list[dict],
        context: str = "",
    ) -> str:
        """
        Chat with the AI Tutor.
        
        Args:
            messages: List of dicts with 'role' ('user' or 'model') and 'content'.
            context:  Optional RAG context retrieved for this query.
        """

    @property
    def name(self) -> str:
        """Human-readable provider name."""
        return self.__class__.__name__
