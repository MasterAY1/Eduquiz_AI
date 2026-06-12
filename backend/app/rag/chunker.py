"""Token-based text chunker with configurable overlap."""

import tiktoken

from app.utils.logger import get_logger

logger = get_logger(__name__)


class TextChunker:
    """
    Split a long text into overlapping token-based chunks for embedding.

    Args:
        chunk_size: Maximum tokens per chunk.
        overlap:    Number of tokens to overlap between consecutive chunks.
    """

    def __init__(self, chunk_size: int = 500, overlap: int = 50) -> None:
        self.chunk_size = chunk_size
        self.overlap = overlap
        self.encoding = tiktoken.get_encoding("cl100k_base")

    def split_text(self, text: str) -> list[str]:
        """
        Split ``text`` into overlapping chunks of at most ``chunk_size`` tokens.

        Returns:
            List of decoded chunk strings.
        """
        tokens = self.encoding.encode(text)
        if not tokens:
            return []

        chunks: list[str] = []
        start = 0
        while start < len(tokens):
            end = min(start + self.chunk_size, len(tokens))
            chunk_tokens = tokens[start:end]
            chunk_text = self.encoding.decode(chunk_tokens)
            chunks.append(chunk_text)
            if end == len(tokens):
                break
            start += self.chunk_size - self.overlap

        logger.debug(
            f"Text split into {len(chunks)} chunks "
            f"(size={self.chunk_size}, overlap={self.overlap})."
        )
        return chunks

    def count_tokens(self, text: str) -> int:
        """Return the token count for a given text string."""
        return len(self.encoding.encode(text))
