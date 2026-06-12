"""JWT and password security utilities."""

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import get_settings
from app.utils.errors import AuthenticationError

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ── Password hashing ───────────────────────────────────────────────────────────


def verify_password(plain: str, hashed: str) -> bool:
    """Compare a plain-text password against a stored bcrypt hash."""
    return pwd_context.verify(plain, hashed)


def get_password_hash(password: str) -> str:
    """Hash a plain-text password with bcrypt."""
    return pwd_context.hash(password)


# ── JWT tokens ─────────────────────────────────────────────────────────────────


def create_access_token(data: dict) -> str:
    """Create a short-lived access JWT (default 15 minutes)."""
    settings = get_settings()
    payload = data.copy()
    expire = datetime.now(tz=timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload.update({"exp": expire, "type": "access"})
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(data: dict) -> str:
    """Create a long-lived refresh JWT (default 30 days)."""
    settings = get_settings()
    payload = data.copy()
    expire = datetime.now(tz=timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    payload.update({"exp": expire, "type": "refresh"})
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def hash_token(token: str) -> str:
    """SHA-256 hash of a token string for safe database storage."""
    return hashlib.sha256(token.encode()).hexdigest()


def decode_access_token(token: str) -> dict:
    """
    Decode and validate an access JWT.

    Raises:
        AuthenticationError: if the token is expired, malformed, or wrong type.
    """
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "access":
            raise AuthenticationError("Invalid token type.")
        return payload
    except JWTError as exc:
        raise AuthenticationError("Could not validate credentials.") from exc


def decode_refresh_token(token: str) -> dict:
    """
    Decode and validate a refresh JWT.

    Raises:
        AuthenticationError: if the token is expired, malformed, or wrong type.
    """
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "refresh":
            raise AuthenticationError("Invalid token type.")
        return payload
    except JWTError as exc:
        raise AuthenticationError("Could not validate refresh token.") from exc
