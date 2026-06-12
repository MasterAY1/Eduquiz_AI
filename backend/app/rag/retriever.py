"""Vector similarity retriever using pgvector cosine distance."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import DocumentChunk
from app.utils.logger import get_logger

logger = get_logger(__name__)


class VectorRetriever:
    """Retrieve the most semantically similar document chunks from PostgreSQL/pgvector."""

    async def similarity_search(
        self,
        db: AsyncSession,
        document_id: str | uuid.UUID,
        query_embedding: list[float],
        top_k: int = 8,
    ) -> list[DocumentChunk]:
        """
        Find the ``top_k`` chunks closest to ``query_embedding`` using cosine distance.

        Args:
            db:              Active async DB session.
            document_id:     UUID of the parent document.
            query_embedding: 768-dimensional query vector.
            top_k:           Number of nearest neighbours to return.

        Returns:
            List of DocumentChunk ORM objects ordered by ascending cosine distance.
        """
        stmt = (
            select(DocumentChunk)
            .where(DocumentChunk.document_id == document_id)
            .order_by(DocumentChunk.embedding.cosine_distance(query_embedding))
            .limit(top_k)
        )
        result = await db.execute(stmt)
        chunks = list(result.scalars().all())
        logger.debug(
            f"Vector search for doc {document_id}: retrieved {len(chunks)} chunks."
        )
        return chunks
