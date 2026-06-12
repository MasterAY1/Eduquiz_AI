"""Document and DocumentChunk ORM models with pgvector embeddings."""

import enum
import uuid

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    BigInteger,
    Boolean,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import TimestampMixin


class SourceType(str, enum.Enum):
    PDF = "pdf"
    DOCX = "docx"
    PPT = "ppt"
    TXT = "txt"
    IMAGE = "image"


class AnalysisStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    INDEXED = "indexed"
    FAILED = "failed"


class Document(Base, TimestampMixin):
    """Uploaded educational document (PDF, DOCX, PPT, TXT, image)."""

    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    category: Mapped[str] = mapped_column(String(50), server_default="study_material")
    source_type: Mapped[SourceType] = mapped_column(
        SAEnum(SourceType, name="sourcetype"), nullable=False
    )
    original_filename: Mapped[str | None] = mapped_column(String(500))
    file_url: Mapped[str | None] = mapped_column(Text)  # Cloudinary URL
    file_size_bytes: Mapped[int | None] = mapped_column(BigInteger)
    extracted_text: Mapped[str | None] = mapped_column(Text)
    subject: Mapped[str | None] = mapped_column(String(200))
    detected_level: Mapped[str | None] = mapped_column(String(100))
    topics: Mapped[dict] = mapped_column(JSONB, default=list, server_default="[]")
    subtopics: Mapped[dict] = mapped_column(JSONB, default=dict, server_default="{}")
    summary: Mapped[str | None] = mapped_column(Text)
    word_count: Mapped[int | None] = mapped_column(Integer)
    chunk_count: Mapped[int] = mapped_column(Integer, default=0)
    analysis_status: Mapped[AnalysisStatus] = mapped_column(
        SAEnum(AnalysisStatus, name="analysisstatus"),
        default=AnalysisStatus.PENDING,
        nullable=False,
    )
    error_message: Mapped[str | None] = mapped_column(Text)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="documents")  # type: ignore[name-defined]  # noqa: F821
    chunks: Mapped[list["DocumentChunk"]] = relationship(
        "DocumentChunk",
        back_populates="document",
        cascade="all, delete-orphan",
    )
    quizzes: Mapped[list["Quiz"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Quiz", back_populates="document"
    )


class DocumentChunk(Base):
    """A single text chunk of a document with a vector embedding."""

    __tablename__ = "document_chunks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    token_count: Mapped[int] = mapped_column(Integer, nullable=False)
    # Configurable dimensional embedding (e.g. 768 from Gemini text-embedding-005)
    from app.config import get_settings
    embedding = mapped_column(Vector(get_settings().EMBEDDING_DIMENSION))
    chunk_metadata: Mapped[dict] = mapped_column(
        JSONB, default=dict, server_default="{}"
    )

    # Relationships
    document: Mapped["Document"] = relationship("Document", back_populates="chunks")
