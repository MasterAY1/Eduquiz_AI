"""Image text extractor using Pillow + pytesseract (optional)."""

from io import BytesIO

from app.parsers.base import BaseParser
from app.utils.logger import get_logger

logger = get_logger(__name__)


class ImageParser(BaseParser):
    """
    Extract text from image files using pytesseract OCR.

    Falls back to an empty string with a warning if pytesseract is not installed
    or Tesseract is not found on the system PATH.
    """

    def parse(self, file_bytes: bytes, filename: str = "") -> str:
        try:
            from PIL import Image  # type: ignore[import]
            import pytesseract  # type: ignore[import]

            image = Image.open(BytesIO(file_bytes))
            text = pytesseract.image_to_string(image)
            logger.info(
                f"Image parsed via OCR: {filename!r} — {len(text)} chars extracted."
            )
            return text
        except ImportError:
            logger.warning(
                "pytesseract is not installed. Image OCR is unavailable. "
                "Install it with: pip install pytesseract"
            )
            return ""
        except Exception as exc:
            logger.warning(f"ImageParser OCR failed for {filename!r}: {exc}")
            return ""
