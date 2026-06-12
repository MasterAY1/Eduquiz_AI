"""Application configuration using Pydantic BaseSettings."""

from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """All application settings loaded from environment variables / .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Database ──────────────────────────────────────────────────────────────
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:password@localhost:5432/eduquiz",
        description="Async PostgreSQL connection URL (Supabase or local)",
    )

    # ── Supabase ──────────────────────────────────────────────────────────────
    SUPABASE_URL: str | None = Field(
        default=None,
        description="Supabase project URL (e.g. https://xxx.supabase.co)",
    )
    SUPABASE_ANON_KEY: str | None = Field(
        default=None,
        description="Supabase anon/public API key",
    )
    SUPABASE_SERVICE_ROLE_KEY: str | None = Field(
        default=None,
        description="Supabase service-role key (server-side only)",
    )
    SUPABASE_STORAGE_BUCKET: str = Field(
        default="documents",
        description="Supabase Storage bucket name for uploaded files",
    )

    # ── JWT Security ──────────────────────────────────────────────────────────
    SECRET_KEY: str = Field(
        default="change-this-secret-key-in-production-please",
        description="Secret key used to sign JWT tokens",
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=15,
        description="Access token lifetime in minutes",
    )
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(
        default=30,
        description="Refresh token lifetime in days",
    )
    ALGORITHM: str = "HS256"

    # ── AI Providers ──────────────────────────────────────────────────────────
    AI_PRIMARY_PROVIDER: Literal["gemini", "deepseek"] = Field(
        default="gemini",
        description="Primary AI provider: gemini or deepseek",
    )
    GEMINI_API_KEY: str | None = Field(default=None)
    DEEPSEEK_API_KEY: str | None = Field(default=None)

    # ── Cloudinary (legacy / optional) ────────────────────────────────────────
    CLOUDINARY_CLOUD_NAME: str | None = Field(default=None)
    CLOUDINARY_API_KEY: str | None = Field(default=None)
    CLOUDINARY_API_SECRET: str | None = Field(default=None)

    # ── App Settings ──────────────────────────────────────────────────────────
    FRONTEND_URL: str = Field(default="http://localhost:3000")
    ENVIRONMENT: Literal["development", "staging", "production"] = Field(
        default="development"
    )
    LOG_LEVEL: str = Field(default="INFO")

    # ── Security & Architecture Updates ───────────────────────────────────────
    EMBEDDING_DIMENSION: int = Field(
        default=768,
        description="Dimension length of text embeddings",
    )
    VIRUS_SCAN_ENABLED: bool = Field(
        default=True,
        description="Toggle file signature and malware scanning on document upload",
    )

    @property
    def use_supabase_storage(self) -> bool:
        """True when Supabase credentials are configured for storage."""
        return bool(self.SUPABASE_URL and self.SUPABASE_SERVICE_ROLE_KEY)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached Settings instance (loaded once at first call)."""
    return Settings()
