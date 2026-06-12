"""Abstract base class for all document parsers."""

from abc import ABC, abstractmethod


class BaseParser(ABC):
    """Interface for file-format-specific text extractors."""

    @abstractmethod
    def parse(self, file_bytes: bytes, filename: str = "") -> str:
        """
        Extract plain text from raw file bytes.

        Args:
            file_bytes: Raw bytes of the uploaded file.
            filename:   Original filename (used for extension hints).

        Returns:
            Extracted plain-text string.
        """
