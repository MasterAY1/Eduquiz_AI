"""User and RefreshToken ORM models."""

import enum
import uuid
from datetime import date, datetime

from sqlalchemy import (
    ARRAY,
    Boolean,
    Date,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import TimestampMixin


class EducationalLevel(str, enum.Enum):
    PRIMARY = "primary"
    JSS = "jss"
    SSS = "sss"
    POLYTECHNIC = "polytechnic"
    COL_OF_EDU = "col_of_edu"
    UNIVERSITY = "university"

class DashboardPersona(str, enum.Enum):
    EXAM_CANDIDATE = "exam_candidate"
    TERTIARY_STUDENT = "tertiary_student"
    EDUCATOR = "educator"

class LearningProfile(Base, TimestampMixin):
    """A personalized learning journey for a user."""
    __tablename__ = "learning_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    persona: Mapped[DashboardPersona] = mapped_column(
        SAEnum(DashboardPersona, name="dashboardpersona"), nullable=False
    )
    academic_category: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. WAEC, JAMB, University
    institution_name: Mapped[str | None] = mapped_column(String(300))
    faculty: Mapped[str | None] = mapped_column(String(200))
    department: Mapped[str | None] = mapped_column(String(200))
    academic_level: Mapped[str | None] = mapped_column(String(100))
    target_exam: Mapped[str | None] = mapped_column(String(100))
    preferred_subjects: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="learning_profiles")


class User(Base, TimestampMixin):
    """Platform user account."""

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    password_hash: Mapped[str | None] = mapped_column(String(255))
    educational_level: Mapped[EducationalLevel | None] = mapped_column(
        SAEnum(EducationalLevel, name="educationallevel"), nullable=True
    )
    school_name: Mapped[str | None] = mapped_column(String(300))
    department: Mapped[str | None] = mapped_column(String(200))
    class_level: Mapped[str | None] = mapped_column(String(100))
    preferred_subjects: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    avatar_url: Mapped[str | None] = mapped_column(Text)
    xp_points: Mapped[int] = mapped_column(Integer, default=0)
    streak_days: Mapped[int] = mapped_column(Integer, default=0)
    last_active_date: Mapped[date | None] = mapped_column(Date)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_email_verified: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    documents: Mapped[list["Document"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Document", back_populates="user", lazy="select"
    )
    quiz_attempts: Mapped[list["QuizAttempt"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "QuizAttempt", back_populates="user", lazy="select"
    )
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(
        "RefreshToken", back_populates="user", lazy="select"
    )
    learning_profiles: Mapped[list["LearningProfile"]] = relationship(
        "LearningProfile", back_populates="user", lazy="select", cascade="all, delete-orphan"
    )


class RefreshToken(Base):
    """Stored refresh-token hashes for secure rotation."""

    __tablename__ = "refresh_tokens"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    token_hash: Mapped[str] = mapped_column(String(512), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="refresh_tokens")
