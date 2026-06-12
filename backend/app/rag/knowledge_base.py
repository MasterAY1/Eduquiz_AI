"""Knowledge base service: chunk → embed → store → retrieve."""

import uuid

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import DocumentChunk
from app.rag.chunker import TextChunker
from app.rag.embedder import GeminiEmbedder
from app.rag.retriever import VectorRetriever
from app.utils.logger import get_logger

logger = get_logger(__name__)


class KnowledgeBaseService:
    """Orchestrates the full RAG pipeline: indexing and context retrieval."""

    def __init__(self) -> None:
        self.chunker = TextChunker(chunk_size=500, overlap=50)
        self.embedder = GeminiEmbedder()
        self.retriever = VectorRetriever()

    async def index_document(
        self,
        db: AsyncSession,
        document_id: str | uuid.UUID,
        text: str,
    ) -> int:
        """
        Chunk, embed, and persist all chunks for a document.

        Steps:
            1. Delete any existing chunks for this document.
            2. Split text into overlapping token chunks.
            3. Embed all chunks in batches.
            4. Bulk-insert DocumentChunk rows.

        Args:
            db:          Active async DB session.
            document_id: UUID of the parent document.
            text:        Full extracted text to index.

        Returns:
            Number of chunks indexed.
        """
        # 1. Remove stale chunks
        await db.execute(
            delete(DocumentChunk).where(
                DocumentChunk.document_id == document_id  # type: ignore[arg-type]
            )
        )

        # 2. Split text
        chunk_texts = self.chunker.split_text(text)
        if not chunk_texts:
            logger.warning(f"No chunks produced for document {document_id}.")
            return 0

        logger.info(f"Indexing {len(chunk_texts)} chunks for document {document_id}.")

        # 3. Embed all chunks
        embeddings = await self.embedder.embed(chunk_texts)

        # 4. Build ORM objects
        chunks: list[DocumentChunk] = []
        for idx, (content, embedding) in enumerate(zip(chunk_texts, embeddings)):
            token_count = self.chunker.count_tokens(content)
            chunk = DocumentChunk(
                document_id=document_id,
                chunk_index=idx,
                content=content,
                token_count=token_count,
                embedding=embedding,
                chunk_metadata={"index": idx},
            )
            chunks.append(chunk)

        db.add_all(chunks)
        await db.flush()

        logger.info(
            f"Successfully indexed {len(chunks)} chunks for document {document_id}."
        )
        return len(chunks)

    async def retrieve_context(
        self,
        db: AsyncSession,
        document_id: str | uuid.UUID,
        query: str,
        top_k: int = 8,
    ) -> str:
        """
        Embed ``query`` and return the concatenated text of the most relevant chunks.

        Args:
            db:          Active async DB session.
            document_id: UUID of the target document.
            query:       Natural-language query string.
            top_k:       Number of chunks to retrieve.

        Returns:
            Chunk texts joined by a separator.
        """
        query_embedding = await self.embedder.embed_query(query)
        chunks = await self.retriever.similarity_search(
            db, document_id, query_embedding, top_k
        )
        if not chunks:
            logger.warning(f"No relevant chunks found for query in doc {document_id}.")
            return ""
        return "\n\n---\n\n".join(c.content for c in chunks)

    async def delete_embeddings(
        self,
        db: AsyncSession,
        document_id: str | uuid.UUID,
    ) -> None:
        """
        Remove all stored chunks (and their embeddings) for a document.

        Args:
            db:          Active async DB session.
            document_id: UUID of the document whose chunks should be deleted.
        """
        await db.execute(
            delete(DocumentChunk).where(
                DocumentChunk.document_id == document_id  # type: ignore[arg-type]
            )
        )
        await db.flush()
        logger.info(f"Deleted all embeddings for document {document_id}.")


# Module-level singleton
knowledge_base = KnowledgeBaseService()
