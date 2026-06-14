"""Pydantic v2 schemas for authentication endpoints."""

import uuid
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator

from app.schemas.profile import LearningProfileResponse


class RegisterRequest(BaseModel):
    """Payload for POST /auth/register."""

    full_name: str
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        return v

    @field_validator("full_name")
    @classmethod
    def full_name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Full name must not be empty.")
        return v.strip()


class LoginRequest(BaseModel):
    """Payload for POST /auth/login."""

    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """User data returned to the client (no sensitive fields)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    full_name: str
    email: str
    educational_level: Optional[str] = None
    school_name: Optional[str] = None
    department: Optional[str] = None
    class_level: Optional[str] = None
    preferred_subjects: Optional[list[str]] = None
    avatar_url: Optional[str] = None
    xp_points: int
    streak_days: int
    is_email_verified: bool
    created_at: datetime
    learning_profiles: List[LearningProfileResponse] = []


class TokenResponse(BaseModel):
    """JWT token pair returned after successful auth."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class RefreshRequest(BaseModel):
    """Payload for POST /auth/refresh."""

    refresh_token: str


class UpdateProfileRequest(BaseModel):
    """Payload for PUT /auth/me — all fields optional."""

    full_name: Optional[str] = None
    school_name: Optional[str] = None
    department: Optional[str] = None
    class_level: Optional[str] = None
    preferred_subjects: Optional[list[str]] = None

class AvatarUploadRequest(BaseModel):
    """Payload for POST /auth/me/avatar via JSON."""
    file_base64: str
