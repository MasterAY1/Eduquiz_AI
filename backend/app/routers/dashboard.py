"""Dashboard API router."""

import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.dependencies import get_db, get_current_active_user
from app.models.document import Document
from app.models.quiz import Quiz, QuizAttempt
from app.models.user import User

router = APIRouter(tags=["dashboard"])


@router.get(
    "/stats",
    status_code=status.HTTP_200_OK,
)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict:
    """Retrieve comprehensive dashboard stats, streak metrics, and recent activities."""
    user_id = current_user.id

    # 1. Total documents
    doc_count_res = await db.execute(
        select(func.count(Document.id)).where(
            Document.user_id == user_id, Document.is_deleted == False
        )
    )
    total_documents = doc_count_res.scalar_one()

    # 2. Total quizzes generated
    quiz_count_res = await db.execute(
        select(func.count(Quiz.id)).where(Quiz.user_id == user_id)
    )
    total_quizzes = quiz_count_res.scalar_one()

    # 3. Quizzes completed (attempts)
    completed_attempts_res = await db.execute(
        select(func.count(QuizAttempt.id)).where(
            QuizAttempt.user_id == user_id, QuizAttempt.completed_at.is_not(None)
        )
    )
    quizzes_taken = completed_attempts_res.scalar_one()

    # 4. Average score on completed quizzes
    avg_score_res = await db.execute(
        select(func.avg(QuizAttempt.percentage)).where(
            QuizAttempt.user_id == user_id, QuizAttempt.completed_at.is_not(None)
        )
    )
    avg_score_val = avg_score_res.scalar_one()
    average_score = float(avg_score_val) if avg_score_val is not None else 0.0

    # 5. Recent documents (last 5)
    recent_docs_res = await db.execute(
        select(Document)
        .where(Document.user_id == user_id, Document.is_deleted == False)
        .order_by(Document.created_at.desc())
        .limit(5)
    )
    recent_docs = recent_docs_res.scalars().all()
    recent_documents_data = [
        {
            "id": d.id,
            "title": d.title,
            "source_type": d.source_type.value,
            "analysis_status": d.analysis_status.value,
            "created_at": d.created_at,
        }
        for d in recent_docs
    ]

    # 6. Recent quiz attempts (last 5 completed attempts with quiz details)
    recent_attempts_res = await db.execute(
        select(QuizAttempt)
        .options(selectinload(QuizAttempt.quiz))
        .where(QuizAttempt.user_id == user_id, QuizAttempt.completed_at.is_not(None))
        .order_by(QuizAttempt.completed_at.desc())
        .limit(5)
    )
    recent_attempts = recent_attempts_res.scalars().all()
    recent_attempts_data = [
        {
            "attempt_id": a.id,
            "quiz_id": a.quiz_id,
            "quiz_title": a.quiz.title if a.quiz else "Deleted Quiz",
            "score": float(a.score or 0.0),
            "max_score": float(a.max_score or 0.0),
            "percentage": float(a.percentage or 0.0),
            "completed_at": a.completed_at,
            "xp_earned": a.xp_earned,
        }
        for a in recent_attempts
    ]

    return {
        "total_documents": total_documents,
        "total_quizzes": total_quizzes,
        "quizzes_taken": quizzes_taken,
        "average_score": round(average_score, 2),
        "xp_points": current_user.xp_points,
        "streak_days": current_user.streak_days,
        "recent_documents": recent_documents_data,
        "recent_attempts": recent_attempts_data,
    }


@router.get(
    "/history",
    status_code=status.HTTP_200_OK,
)
async def get_attempt_history(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict:
    """Retrieve a paginated list of all completed quiz attempts."""
    user_id = current_user.id

    base_q = select(QuizAttempt).where(
        QuizAttempt.user_id == user_id, QuizAttempt.completed_at.is_not(None)
    )

    total_res = await db.execute(select(func.count()).select_from(base_q.subquery()))
    total = total_res.scalar_one()

    attempts_res = await db.execute(
        base_q.options(selectinload(QuizAttempt.quiz))
        .order_by(QuizAttempt.completed_at.desc())
        .offset(skip)
        .limit(limit)
    )
    attempts = attempts_res.scalars().all()

    items = [
        {
            "attempt_id": a.id,
            "quiz_id": a.quiz_id,
            "quiz_title": a.quiz.title if a.quiz else "Deleted Quiz",
            "subject": a.quiz.subject if a.quiz else None,
            "difficulty": a.quiz.difficulty if a.quiz else "medium",
            "score": float(a.score or 0.0),
            "max_score": float(a.max_score or 0.0),
            "percentage": float(a.percentage or 0.0),
            "time_taken_seconds": a.time_taken_seconds,
            "xp_earned": a.xp_earned,
            "completed_at": a.completed_at,
        }
        for a in attempts
    ]

    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit,
    }
