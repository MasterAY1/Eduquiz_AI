"""PDF text extractor using PyMuPDF (fitz) with PyPDF fallback."""

import fitz  # PyMuPDF

from app.parsers.base import BaseParser
from app.utils.logger import get_logger

logger = get_logger(__name__)


class PDFParser(BaseParser):
    """Extract text from PDF files using PyMuPDF with PyPDF fallback."""

    def parse(self, file_bytes: bytes, filename: str = "") -> str:
        """
        Iterate every page of the PDF and concatenate extracted text.
        """
        extracted = ""
        num_pages = 0
        try:
            with fitz.open(stream=file_bytes, filetype="pdf") as doc:
                num_pages = len(doc)
                text_parts: list[str] = []
                for page in doc:
                    page_text = page.get_text()
                    if page_text and page_text.strip():
                        text_parts.append(page_text)
                extracted = "\n".join(text_parts)

            logger.info(
                f"PDF parsed: {filename!r} — {num_pages} pages, "
                f"{len(extracted)} chars extracted."
            )
            if extracted.strip():
                return extracted
        except Exception as exc:
            logger.error(f"PyMuPDF parser failed for {filename!r}: {exc}")

        # Fallback to pypdf if fitz failed or returned empty text
        try:
            import io
            import pypdf

            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            fallback_parts = []
            for page in reader.pages:
                t = page.extract_text()
                if t and t.strip():
                    fallback_parts.append(t)
            extracted = "\n".join(fallback_parts)
            if extracted.strip():
                logger.info(
                    f"PyPDF fallback succeeded for {filename!r}: {len(reader.pages)} pages, {len(extracted)} chars."
                )
                return extracted
        except Exception as fb_exc:
            logger.error(f"PyPDF fallback also failed for {filename!r}: {fb_exc}")

        return extracted
