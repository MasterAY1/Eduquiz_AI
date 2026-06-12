"""PDF text extractor using PyMuPDF (fitz)."""

import fitz  # PyMuPDF

from app.parsers.base import BaseParser
from app.utils.logger import get_logger

logger = get_logger(__name__)


class PDFParser(BaseParser):
    """Extract text from PDF files using PyMuPDF."""

    def parse(self, file_bytes: bytes, filename: str = "") -> str:
        """
        Iterate every page of the PDF and concatenate extracted text.

        Args:
            file_bytes: Raw PDF bytes.
            filename:   Original filename (informational).

        Returns:
            Full extracted text across all pages.
        """
        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            text_parts: list[str] = []
            for page_num, page in enumerate(doc, start=1):
                page_text = page.get_text()
                if page_text.strip():
                    text_parts.append(page_text)
            doc.close()
            extracted = "\n".join(text_parts)
            logger.info(
                f"PDF parsed: {filename!r} — {len(doc)} pages, "
                f"{len(extracted)} chars extracted."
            )
            return extracted
        except Exception as exc:
            logger.error(f"PDFParser failed for {filename!r}: {exc}")
            raise
