"""Quizzes API router."""

import uuid
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, get_current_active_user
from app.models.user import User
from app.schemas.quiz import (
    AttemptResultResponse,
    QuizGenerateRequest,
    QuizResponse,
    QuizSummaryResponse,
    StartAttemptResponse,
    SubmitAttemptRequest,
)
from app.services.quiz_service import quiz_service
from app.utils.rate_limit import limiter

router = APIRouter(tags=["quizzes"])


@router.get("/templates", status_code=status.HTTP_200_OK)
async def get_quiz_templates():
    """Fetch configuration templates for CBT Exam Simulation."""
    return quiz_service.get_exam_templates()



@router.post(
    "/generate",
    response_model=QuizResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("10/hour")
async def generate_quiz(
    request: Request,
    generate_data: QuizGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> QuizResponse:
    """Generate a new quiz from a user's uploaded document using RAG + AI."""
    quiz = await quiz_service.generate_quiz(db, current_user.id, generate_data)
    return QuizResponse.model_validate(quiz)


@router.get(
    "",
    response_model=list[QuizSummaryResponse],
    status_code=status.HTTP_200_OK,
)
async def get_quizzes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list[QuizSummaryResponse]:
    """Retrieve all quizzes created by the logged-in user."""
    quizzes = await quiz_service.get_quizzes(db, current_user.id)
    return [QuizSummaryResponse.model_validate(q) for q in quizzes]


@router.get(
    "/{quiz_id}",
    response_model=QuizResponse,
    status_code=status.HTTP_200_OK,
)
async def get_quiz(
    quiz_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> QuizResponse:
    """Fetch a specific quiz (without answers) to render in the client."""
    quiz = await quiz_service.get_quiz(db, quiz_id, current_user.id)
    return QuizResponse.model_validate(quiz)


@router.post(
    "/{quiz_id}/attempt/start",
    response_model=StartAttemptResponse,
    status_code=status.HTTP_201_CREATED,
)
async def start_attempt(
    quiz_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> StartAttemptResponse:
    """Initialize a new attempt session for a quiz (starts the timer)."""
    return await quiz_service.start_attempt(db, quiz_id, current_user.id)


@router.post(
    "/attempt/{attempt_id}/submit",
    response_model=AttemptResultResponse,
    status_code=status.HTTP_200_OK,
)
async def submit_attempt(
    attempt_id: uuid.UUID,
    request: SubmitAttemptRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> AttemptResultResponse:
    """Submit responses for a quiz attempt, scoring it and generating AI review feedback."""
    return await quiz_service.submit_attempt(db, attempt_id, current_user.id, request)


@router.get(
    "/attempt/{attempt_id}",
    response_model=AttemptResultResponse,
    status_code=status.HTTP_200_OK,
)
async def get_attempt(
    attempt_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> AttemptResultResponse:
    """Retrieve detailed results and AI feedback for a previously completed attempt."""
    return await quiz_service.get_attempt(db, attempt_id, current_user.id)
