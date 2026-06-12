"""Chat Session and Message ORM models."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import TimestampMixin


class ChatSession(Base, TimestampMixin):
    """A conversation session between a student and the AI Tutor."""

    __tablename__ = "chat_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    document_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="SET NULL"),
        index=True,
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    
    prompt_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("ai_prompts.id", ondelete="SET NULL"))
    prompt_version: Mapped[int | None] = mapped_column(Integer)
    prompt_variant: Mapped[str | None] = mapped_column(String(50))

    # Relationships
    messages: Mapped[list["ChatMessage"]] = relationship(
        "ChatMessage", back_populates="session", cascade="all, delete-orphan", order_by="ChatMessage.created_at"
    )
    user: Mapped["User"] = relationship("User")  # type: ignore[name-defined]  # noqa: F821
    document: Mapped["Document | None"] = relationship("Document")  # type: ignore[name-defined]  # noqa: F821


class ChatMessage(Base):
    """A single message within a ChatSession."""

    __tablename__ = "chat_messages"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("chat_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    sender: Mapped[str] = mapped_column(String(20), nullable=False)  # 'user' or 'ai'
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    session: Mapped["ChatSession"] = relationship("ChatSession", back_populates="messages")
