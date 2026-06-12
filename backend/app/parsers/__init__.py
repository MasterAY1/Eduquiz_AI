"""Parsers package — factory function for source-type-specific parsers."""

from app.parsers.base import BaseParser
from app.parsers.pdf_parser import PDFParser
from app.parsers.docx_parser import DocxParser
from app.parsers.ppt_parser import PPTParser
from app.parsers.txt_parser import TxtParser
from app.parsers.image_parser import ImageParser

__all__ = [
    "BaseParser",
    "PDFParser",
    "DocxParser",
    "PPTParser",
    "TxtParser",
    "ImageParser",
    "get_parser",
]


def get_parser(source_type: str) -> BaseParser:
    """
    Return the appropriate parser for a given source type.

    Args:
        source_type: One of 'pdf', 'docx', 'ppt', 'txt', 'image'.

    Returns:
        A concrete BaseParser instance. Falls back to TxtParser for unknown types.
    """
    parsers: dict[str, BaseParser] = {
        "pdf": PDFParser(),
        "docx": DocxParser(),
        "ppt": PPTParser(),
        "txt": TxtParser(),
        "image": ImageParser(),
    }
    return parsers.get(source_type, TxtParser())
