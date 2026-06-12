"""Documents API router."""

import uuid
from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, Request, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, get_current_active_user
from app.models.user import User
from app.schemas.document import (
    DocumentListResponse,
    DocumentResponse,
    DocumentStatusResponse,
    DocumentUploadResponse,
)
from app.services.document_service import document_service
from app.utils.rate_limit import limiter

router = APIRouter(tags=["documents"])


@router.post(
    "/upload",
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("10/hour")
async def upload_document(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    category: str = Form("study_material"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> DocumentUploadResponse:
    """
    Upload a document (PDF, Word, TXT, Slides, Image) to Cloudinary.
    Fires off an asynchronous task to parse and index it into pgvector.
    """
    doc = await document_service.upload_document(
        db=db,
        user_id=current_user.id,
        file=file,
        background_tasks=background_tasks,
        category=category,
    )
    return DocumentUploadResponse.model_validate(doc)


@router.get(
    "",
    response_model=DocumentListResponse,
    status_code=status.HTTP_200_OK,
)
async def get_documents(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> DocumentListResponse:
    """Get a paginated list of documents owned by the active user."""
    return await document_service.get_documents(
        db=db,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{document_id}",
    response_model=DocumentResponse,
    status_code=status.HTTP_200_OK,
)
async def get_document(
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> DocumentResponse:
    """Get full details of a specific document (including summary and extracted topics)."""
    doc = await document_service.get_document(
        db=db,
        document_id=document_id,
        user_id=current_user.id,
    )
    return DocumentResponse.model_validate(doc)


@router.get(
    "/{document_id}/status",
    response_model=DocumentStatusResponse,
    status_code=status.HTTP_200_OK,
)
async def get_document_status(
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> DocumentStatusResponse:
    """Retrieve the background parsing and vector indexing status for a document."""
    return await document_service.get_document_status(
        db=db,
        document_id=document_id,
        user_id=current_user.id,
    )


@router.delete(
    "/{document_id}",
    status_code=status.HTTP_200_OK,
)
async def delete_document(
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict[str, str]:
    """Soft-delete a document and remove all of its indexed chunks from pgvector."""
    await document_service.delete_document(
        db=db,
        document_id=document_id,
        user_id=current_user.id,
    )
    return {"message": "Document deleted successfully."}
