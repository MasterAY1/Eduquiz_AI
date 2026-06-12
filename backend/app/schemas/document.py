"""Pydantic v2 schemas for document endpoints."""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class DocumentUploadResponse(BaseModel):
    """Returned immediately after file upload (before processing completes)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    source_type: str
    analysis_status: str
    created_at: datetime


class DocumentResponse(BaseModel):
    """Full document representation returned after analysis."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    source_type: str
    original_filename: Optional[str] = None
    file_url: Optional[str] = None
    subject: Optional[str] = None
    detected_level: Optional[str] = None
    topics: Optional[list] = None
    subtopics: Optional[dict] = None
    summary: Optional[str] = None
    word_count: Optional[int] = None
    chunk_count: int
    analysis_status: str
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class DocumentListResponse(BaseModel):
    """Paginated list of documents."""

    items: list[DocumentResponse]
    total: int
    skip: int
    limit: int


class DocumentStatusResponse(BaseModel):
    """Polling response for background document processing status."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    analysis_status: str
    progress_message: str
    chunk_count: int
    error_message: Optional[str] = None
