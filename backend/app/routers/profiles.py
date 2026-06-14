"""Learning Profiles API router."""

import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.dependencies import get_db, get_current_active_user
from app.models.user import User, LearningProfile
from app.schemas.profile import LearningProfileCreate, LearningProfileResponse

router = APIRouter(prefix="/profiles", tags=["profiles"])

@router.get("", response_model=List[LearningProfileResponse])
async def get_profiles(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> List[LearningProfileResponse]:
    """Get all learning profiles for the current user."""
    result = await db.execute(
        select(LearningProfile).where(LearningProfile.user_id == current_user.id)
    )
    return result.scalars().all()

@router.post("", response_model=LearningProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_profile(
    profile_data: LearningProfileCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> LearningProfileResponse:
    """Create a new learning profile and set it as active."""
    # Deactivate other profiles
    await db.execute(
        update(LearningProfile)
        .where(LearningProfile.user_id == current_user.id)
        .values(is_active=False)
    )

    new_profile = LearningProfile(
        user_id=current_user.id,
        persona=profile_data.persona,
        academic_category=profile_data.academic_category,
        institution_name=profile_data.institution_name,
        faculty=profile_data.faculty,
        department=profile_data.department,
        academic_level=profile_data.academic_level,
        target_exam=profile_data.target_exam,
        preferred_subjects=profile_data.preferred_subjects,
        is_active=True,
    )
    db.add(new_profile)
    await db.commit()
    await db.refresh(new_profile)
    return new_profile

@router.post("/{profile_id}/activate", response_model=LearningProfileResponse)
async def activate_profile(
    profile_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> LearningProfileResponse:
    """Switch the active learning profile."""
    # Check if exists and belongs to user
    result = await db.execute(
        select(LearningProfile).where(
            LearningProfile.id == profile_id,
            LearningProfile.user_id == current_user.id
        )
    )
    target_profile = result.scalar_one_or_none()
    if not target_profile:
        raise HTTPException(status_code=404, detail="Profile not found.")

    # Deactivate all
    await db.execute(
        update(LearningProfile)
        .where(LearningProfile.user_id == current_user.id)
        .values(is_active=False)
    )
    
    # Activate target
    target_profile.is_active = True
    await db.commit()
    await db.refresh(target_profile)
    return target_profile
