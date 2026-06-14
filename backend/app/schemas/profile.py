"""Pydantic schemas for Learning Profiles."""

import uuid
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.models.user import DashboardPersona

class LearningProfileBase(BaseModel):
    persona: DashboardPersona
    academic_category: str
    institution_name: Optional[str] = None
    faculty: Optional[str] = None
    department: Optional[str] = None
    academic_level: Optional[str] = None
    target_exam: Optional[str] = None
    preferred_subjects: Optional[List[str]] = None

class LearningProfileCreate(LearningProfileBase):
    """Payload to create a new Learning Profile."""
    pass

class LearningProfileResponse(LearningProfileBase):
    """Returned profile."""
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    user_id: uuid.UUID
    is_active: bool
