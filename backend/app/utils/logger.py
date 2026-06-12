"""Structured logging utility for EduQuiz AI."""

import logging
import sys

from app.config import get_settings


def get_logger(name: str) -> logging.Logger:
    """
    Return a named logger configured with the app log level.

    Usage::

        logger = get_logger(__name__)
        logger.info("Something happened")
    """
    settings = get_settings()
    level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            datefmt="%Y-%m-%dT%H:%M:%S",
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

    logger.setLevel(level)
    return logger
