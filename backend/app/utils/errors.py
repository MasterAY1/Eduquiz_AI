"""Custom exception hierarchy and FastAPI exception handlers for EduQuiz AI."""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


# ── Custom exception hierarchy ─────────────────────────────────────────────────


class EduQuizException(Exception):
    """Base exception for all EduQuiz-specific errors."""

    def __init__(self, message: str = "An unexpected error occurred.") -> None:
        super().__init__(message)
        self.message = message


class NotFoundError(EduQuizException):
    """Resource not found."""

    def __init__(self, message: str = "Resource not found.") -> None:
        super().__init__(message)


class AuthenticationError(EduQuizException):
    """Invalid credentials or token."""

    def __init__(self, message: str = "Authentication failed.") -> None:
        super().__init__(message)


class AuthorizationError(EduQuizException):
    """Authenticated but not permitted."""

    def __init__(self, message: str = "You are not authorised to perform this action.") -> None:
        super().__init__(message)


class ValidationError(EduQuizException):
    """Business-logic validation failure."""

    def __init__(self, message: str = "Validation failed.") -> None:
        super().__init__(message)


class AIProviderError(EduQuizException):
    """AI provider call failed."""

    def __init__(self, message: str = "AI service temporarily unavailable.") -> None:
        super().__init__(message)


class DocumentProcessingError(EduQuizException):
    """Document parsing / indexing failed."""

    def __init__(self, message: str = "Document processing failed.") -> None:
        super().__init__(message)


# ── FastAPI exception handlers ─────────────────────────────────────────────────


def _error_body(status_code: int, message: str) -> dict:
    return {"error": {"status_code": status_code, "message": message}}


async def _not_found_handler(request: Request, exc: NotFoundError) -> JSONResponse:
    return JSONResponse(status_code=404, content=_error_body(404, exc.message))


async def _authentication_handler(request: Request, exc: AuthenticationError) -> JSONResponse:
    return JSONResponse(status_code=401, content=_error_body(401, exc.message))


async def _authorization_handler(request: Request, exc: AuthorizationError) -> JSONResponse:
    return JSONResponse(status_code=403, content=_error_body(403, exc.message))


async def _validation_handler(request: Request, exc: ValidationError) -> JSONResponse:
    return JSONResponse(status_code=422, content=_error_body(422, exc.message))


async def _ai_provider_handler(request: Request, exc: AIProviderError) -> JSONResponse:
    return JSONResponse(status_code=503, content=_error_body(503, exc.message))


async def _document_processing_handler(
    request: Request, exc: DocumentProcessingError
) -> JSONResponse:
    return JSONResponse(status_code=422, content=_error_body(422, exc.message))


async def _generic_handler(request: Request, exc: EduQuizException) -> JSONResponse:
    return JSONResponse(status_code=500, content=_error_body(500, exc.message))


async def _fallback_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    import logging
    logging.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content=_error_body(500, "An internal server error occurred."))


def register_exception_handlers(app: FastAPI) -> None:
    """Register all custom exception handlers on the FastAPI app."""
    app.add_exception_handler(NotFoundError, _not_found_handler)  # type: ignore[arg-type]
    app.add_exception_handler(AuthenticationError, _authentication_handler)  # type: ignore[arg-type]
    app.add_exception_handler(AuthorizationError, _authorization_handler)  # type: ignore[arg-type]
    app.add_exception_handler(ValidationError, _validation_handler)  # type: ignore[arg-type]
    app.add_exception_handler(AIProviderError, _ai_provider_handler)  # type: ignore[arg-type]
    app.add_exception_handler(DocumentProcessingError, _document_processing_handler)  # type: ignore[arg-type]
    app.add_exception_handler(EduQuizException, _generic_handler)  # type: ignore[arg-type]
    app.add_exception_handler(Exception, _fallback_exception_handler)
