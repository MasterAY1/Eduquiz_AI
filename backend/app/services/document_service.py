"""Document upload, background processing, and retrieval service."""

import asyncio
import mimetypes
import uuid
from datetime import datetime, timezone

from fastapi import BackgroundTasks, UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.factory import get_ai_provider
from app.config import get_settings
from app.models.document import AnalysisStatus, Document, SourceType
from app.parsers import get_parser
from app.rag.knowledge_base import knowledge_base
from app.schemas.document import (
    DocumentListResponse,
    DocumentResponse,
    DocumentStatusResponse,
    DocumentUploadResponse,
)
from app.storage.cloudinary_storage import storage
from app.utils.errors import AuthorizationError, NotFoundError, ValidationError
from app.utils.logger import get_logger

logger = get_logger(__name__)


# ── Source type detection ──────────────────────────────────────────────────────

_MIME_MAP: dict[str, SourceType] = {
    "application/pdf": SourceType.PDF,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": SourceType.DOCX,
    "application/msword": SourceType.DOCX,
    "application/vnd.ms-powerpoint": SourceType.PPT,
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": SourceType.PPT,
    "text/plain": SourceType.TXT,
    "image/jpeg": SourceType.IMAGE,
    "image/png": SourceType.IMAGE,
    "image/gif": SourceType.IMAGE,
    "image/webp": SourceType.IMAGE,
}

_EXT_MAP: dict[str, SourceType] = {
    ".pdf": SourceType.PDF,
    ".docx": SourceType.DOCX,
    ".doc": SourceType.DOCX,
    ".pptx": SourceType.PPT,
    ".ppt": SourceType.PPT,
    ".txt": SourceType.TXT,
    ".jpg": SourceType.IMAGE,
    ".jpeg": SourceType.IMAGE,
    ".png": SourceType.IMAGE,
}


def _detect_source_type(content_type: str | None, filename: str) -> SourceType:
    if content_type and content_type in _MIME_MAP:
        return _MIME_MAP[content_type]
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return _EXT_MAP.get(ext, SourceType.TXT)


def _make_title(filename: str) -> str:
    """Strip extension and convert underscores/hyphens to spaces."""
    stem = filename.rsplit(".", 1)[0] if "." in filename else filename
    return stem.replace("_", " ").replace("-", " ").title()


# ── Background processing ──────────────────────────────────────────────────────


async def process_document_background(
    document_id: str,
    file_bytes: bytes,
    source_type: str,
) -> None:
    """
    Run outside the request lifecycle with its own DB session.

    Steps:
      1. Mark document as 'processing'
      2. Parse file bytes to extract text
      3. Index into vector store
      4. Run AI analysis
      5. Update document record with results
      6. Mark as 'indexed' (or 'failed' on error)
    """
    from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

    settings = get_settings()
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    SessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)

    async with SessionLocal() as db:
        try:
            # 1. Update status → processing
            result = await db.execute(
                select(Document).where(Document.id == document_id)
            )
            doc = result.scalar_one_or_none()
            if not doc:
                logger.error(f"Document {document_id} not found in background task.")
                return

            doc.analysis_status = AnalysisStatus.PROCESSING
            await db.commit()

            # 2. Parse text
            parser = get_parser(source_type)
            extracted_text = parser.parse(file_bytes, doc.original_filename or "")

            if not extracted_text or len(extracted_text.strip()) < 50:
                doc.analysis_status = AnalysisStatus.FAILED
                doc.error_message = (
                    "Extracted text is too short. "
                    "The file may be empty, corrupted, or a scanned image without OCR."
                )
                await db.commit()
                return

            doc.extracted_text = extracted_text
            doc.word_count = len(extracted_text.split())
            await db.commit()

            # 3. Index into vector store
            chunk_count = await knowledge_base.index_document(
                db, document_id, extracted_text
            )
            doc.chunk_count = chunk_count
            await db.commit()

            # 4. AI analysis
            ai_provider = get_ai_provider()
            # Use RAG context for the analysis query
            context = await knowledge_base.retrieve_context(
                db, document_id, f"Overview and key topics of this document", top_k=5
            )
            analysis_text = context if context else extracted_text[:8000]
            analysis = await ai_provider.analyze_document(
                analysis_text,
                level=doc.detected_level or "sss",
            )

            # 5. Update document with analysis results
            doc.subject = analysis.subject
            doc.detected_level = analysis.detected_level
            doc.topics = analysis.topics
            doc.subtopics = analysis.subtopics
            doc.summary = analysis.summary
            doc.analysis_status = AnalysisStatus.INDEXED
            doc.error_message = None
            await db.commit()

            logger.info(
                f"Document {document_id} indexed successfully. "
                f"Subject={analysis.subject}, chunks={chunk_count}"
            )

        except Exception as exc:
            logger.error(
                f"Background processing failed for document {document_id}: {exc}",
                exc_info=True,
            )
            try:
                await db.rollback()
                result = await db.execute(
                    select(Document).where(Document.id == document_id)
                )
                doc = result.scalar_one_or_none()
                if doc:
                    doc.analysis_status = AnalysisStatus.FAILED
                    doc.error_message = str(exc)[:500]
                    await db.commit()
            except Exception as inner_exc:
                logger.error(
                    f"Failed to update document status after error: {inner_exc}"
                )
        finally:
            await engine.dispose()


# ── DocumentService ────────────────────────────────────────────────────────────

_STATUS_MESSAGES: dict[str, str] = {
    AnalysisStatus.PENDING.value: "Waiting to start processing…",
    AnalysisStatus.PROCESSING.value: "Extracting text and building knowledge base…",
    AnalysisStatus.INDEXED.value: "Document ready! You can now generate quizzes.",
    AnalysisStatus.FAILED.value: "Processing failed. Please check the error message.",
}


class DocumentService:
    """Handles document uploads, processing status, and retrieval."""

    async def upload_document(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        file: UploadFile,
        background_tasks: BackgroundTasks,
        category: str = "study_material",
    ) -> Document:
        """
        Accept a file upload with security signature validation, virus scanning,
        daily quota verification, and tiered size limits, then queue background indexing.

        Returns:
            Newly created Document ORM object (status=pending).
        """
        # 1. Quota & Plan Type Resolution
        from app.models.security_and_metrics import UserQuota, SystemEvent, AuditLog
        from app.utils.context import client_ip_ctx, user_agent_ctx
        import datetime

        quota_result = await db.execute(
            select(UserQuota).where(UserQuota.user_id == user_id)
        )
        quota = quota_result.scalar_one_or_none()
        if not quota:
            quota = UserQuota(user_id=user_id, plan_type="free")
            db.add(quota)
            await db.flush()

        # Check and reset daily counter if needed
        today_date = datetime.datetime.now(datetime.timezone.utc).date()
        if quota.last_reset_date != today_date:
            quota.uploads_used_today = 0
            quota.quizzes_generated_today = 0
            quota.ai_requests_today = 0
            quota.last_reset_date = today_date
            await db.flush()

        # Enforce upload frequency limit
        max_daily_uploads = 100 if quota.plan_type == "premium" else 5
        if quota.uploads_used_today >= max_daily_uploads:
            raise ValidationError(
                f"Daily document upload limit ({max_daily_uploads}) reached for your {quota.plan_type} plan."
            )

        # 2. Tiered File Size Validation (Streaming checks)
        max_size = 100 * 1024 * 1024 if quota.plan_type == "premium" else 25 * 1024 * 1024
        file_bytes_list = []
        file_size = 0
        chunk_size = 64 * 1024  # 64KB chunks
        while True:
            chunk = await file.read(chunk_size)
            if not chunk:
                break
            file_size += len(chunk)
            if file_size > max_size:
                limit_str = "100MB" if quota.plan_type == "premium" else "25MB"
                raise ValidationError(
                    f"File size exceeds the limit of {limit_str} for your {quota.plan_type} plan."
                )
            file_bytes_list.append(chunk)
        
        file_bytes = b"".join(file_bytes_list)
        if not file_bytes:
            raise ValidationError("Uploaded file is empty.")

        filename = file.filename or "upload"
        
        # 3. Magic Bytes File Signature Validation
        self._validate_file_signature(file_bytes, filename)

        # 4. Malware & Virus Scanning
        from app.utils.virus_scanner import scan_file_bytes
        is_clean, scan_reason = await scan_file_bytes(file_bytes, filename)
        if not is_clean:
            event = SystemEvent(
                event_type="security_violation",
                severity="critical",
                message=f"Malware scanning rejected file: {filename}",
                details={"filename": filename, "reason": scan_reason},
                user_id=user_id,
            )
            db.add(event)
            await db.flush()
            raise ValidationError(f"File upload rejected: {scan_reason}")

        # 5. Safe Document Registration
        source_type = _detect_source_type(file.content_type, filename)
        title = _make_title(filename)

        # Cloudinary resource type
        resource_type = "image" if source_type == SourceType.IMAGE else "raw"

        # Upload to Cloudinary (best-effort; proceed even if it fails)
        file_url: str | None = None
        try:
            file_url = await storage.upload_file(
                file_bytes, str(user_id), filename, resource_type=resource_type
            )
        except Exception as exc:
            logger.warning(f"Cloudinary upload failed (continuing): {exc}")

        doc = Document(
            user_id=user_id,
            title=title,
            source_type=source_type,
            original_filename=filename,
            category=category,
            file_url=file_url,
            file_size_bytes=len(file_bytes),
            analysis_status=AnalysisStatus.PENDING,
        )
        db.add(doc)
        
        # Increment quota usages
        quota.uploads_used_today += 1
        await db.flush()

        # Write compliance Audit Log
        audit = AuditLog(
            user_id=user_id,
            action="document_upload",
            status="success",
            ip_address=client_ip_ctx.get(),
            user_agent=user_agent_ctx.get(),
            details={"filename": filename, "file_size": len(file_bytes), "document_id": str(doc.id)},
        )
        db.add(audit)
        await db.flush()

        # Schedule background processing AFTER flush so doc.id is set
        doc_id = str(doc.id)
        st = source_type.value
        background_tasks.add_task(
            process_document_background,
            doc_id,
            file_bytes,
            st,
        )

        logger.info(f"Document queued for processing: {doc_id} ({source_type.value})")
        return doc

    def _validate_file_signature(self, file_bytes: bytes, filename: str) -> None:
        """Verify the document starts with the matching magic bytes for its extension."""
        ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        header = file_bytes[:16]
        
        if ext == ".pdf":
            if not header.startswith(b"%PDF-"):
                raise ValidationError("Invalid PDF file signature.")
        elif ext in (".docx", ".pptx"):
            if not header.startswith(b"PK\x03\x04"):
                raise ValidationError("Invalid Office document structure (corrupted or wrong format).")
        elif ext in (".png",):
            if not header.startswith(b"\x89PNG\r\n\x1a\n"):
                raise ValidationError("Invalid PNG image structure.")
        elif ext in (".jpg", ".jpeg"):
            if not header.startswith(b"\xff\xd8\xff"):
                raise ValidationError("Invalid JPEG image structure.")
        elif ext in (".gif",):
            if not header.startswith(b"GIF8"):
                raise ValidationError("Invalid GIF image structure.")
        elif ext in (".webp",):
            if not (header.startswith(b"RIFF") and b"WEBP" in header[8:16]):
                raise ValidationError("Invalid WEBP image structure.")
        elif ext == ".txt":
            if b"\x00" in file_bytes[:1024]:
                raise ValidationError("Invalid text file structure: binary format detected.")

    async def get_documents(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> DocumentListResponse:
        """Return paginated documents owned by ``user_id``."""
        base_q = (
            select(Document)
            .where(Document.user_id == user_id, Document.is_deleted == False)  # noqa: E712
        )
        total_result = await db.execute(
            select(func.count()).select_from(base_q.subquery())
        )
        total = total_result.scalar_one()

        result = await db.execute(
            base_q.order_by(Document.created_at.desc()).offset(skip).limit(limit)
        )
        docs = list(result.scalars().all())

        return DocumentListResponse(
            items=[DocumentResponse.model_validate(d) for d in docs],
            total=total,
            skip=skip,
            limit=limit,
        )

    async def get_document(
        self, db: AsyncSession, document_id: uuid.UUID, user_id: uuid.UUID
    ) -> Document:
        """
        Fetch a specific document, verifying ownership.

        Raises:
            NotFoundError: if not found or soft-deleted.
            AuthorizationError: if the document belongs to another user.
        """
        result = await db.execute(
            select(Document).where(
                Document.id == document_id, Document.is_deleted == False  # noqa: E712
            )
        )
        doc = result.scalar_one_or_none()
        if not doc:
            raise NotFoundError(f"Document {document_id} not found.")
        if doc.user_id != user_id:
            raise AuthorizationError("You do not have access to this document.")
        return doc

    async def delete_document(
        self, db: AsyncSession, document_id: uuid.UUID, user_id: uuid.UUID
    ) -> None:
        """Soft-delete a document and remove its vector embeddings."""
        doc = await self.get_document(db, document_id, user_id)
        doc.is_deleted = True
        await db.flush()

        # Remove embeddings asynchronously (best-effort)
        try:
            await knowledge_base.delete_embeddings(db, document_id)
        except Exception as exc:
            logger.warning(f"Failed to delete embeddings for {document_id}: {exc}")

        # Write compliance Audit Log
        from app.models.security_and_metrics import AuditLog
        from app.utils.context import client_ip_ctx, user_agent_ctx
        audit = AuditLog(
            user_id=user_id,
            action="document_deletion",
            status="success",
            ip_address=client_ip_ctx.get(),
            user_agent=user_agent_ctx.get(),
            details={"document_id": str(document_id), "title": doc.title},
        )
        db.add(audit)
        await db.flush()

        logger.info(f"Document {document_id} soft-deleted by user {user_id}.")

    async def get_document_status(
        self, db: AsyncSession, document_id: uuid.UUID, user_id: uuid.UUID
    ) -> DocumentStatusResponse:
        """Return a friendly status message for polling during background processing."""
        doc = await self.get_document(db, document_id, user_id)
        status_val = doc.analysis_status.value
        progress_message = _STATUS_MESSAGES.get(status_val, "Unknown status.")
        return DocumentStatusResponse(
            id=doc.id,
            analysis_status=status_val,
            progress_message=progress_message,
            chunk_count=doc.chunk_count,
            error_message=doc.error_message,
        )


# Module-level singleton
document_service = DocumentService()
