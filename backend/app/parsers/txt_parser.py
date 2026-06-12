"""Plain text extractor with UTF-8 / latin-1 fallback."""

from app.parsers.base import BaseParser
from app.utils.logger import get_logger

logger = get_logger(__name__)


class TxtParser(BaseParser):
    """Decode raw bytes as plain text. Tries UTF-8 first, falls back to latin-1."""

    def parse(self, file_bytes: bytes, filename: str = "") -> str:
        for encoding in ("utf-8", "latin-1"):
            try:
                text = file_bytes.decode(encoding)
                logger.info(
                    f"TXT parsed: {filename!r} using {encoding} — {len(text)} chars."
                )
                return text
            except (UnicodeDecodeError, ValueError):
                continue
        # Last resort: replace undecodable bytes
        text = file_bytes.decode("utf-8", errors="replace")
        logger.warning(f"TXT parsed with replacement characters: {filename!r}")
        return text
