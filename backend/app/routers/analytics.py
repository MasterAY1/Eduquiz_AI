from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_active_user
from app.models.user import User
from app.schemas.analytics import PerformanceReport
from app.services.analytics_service import analytics_service

router = APIRouter(tags=["Analytics"])


@router.get("/performance/{subject}", response_model=PerformanceReport)
async def get_subject_performance(
    subject: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get weakness and strength analytics for a specific subject."""
    return await analytics_service.get_performance_report(
        db=db, user_id=current_user.id, subject=subject
    )
from app.schemas.analytics import PastQuestionIntelligence

@router.get("/past-questions/topics/{subject}", response_model=PastQuestionIntelligence)
async def get_past_question_intelligence(
    subject: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Analyze past questions to extract likely exam areas."""
    return await analytics_service.get_past_question_intelligence(
        db=db, user_id=current_user.id, subject=subject
    )
