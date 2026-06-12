"""Async SQLAlchemy database setup for EduQuiz AI — Supabase PostgreSQL."""

import ssl
from collections.abc import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

settings = get_settings()

_connect_args: dict = {}
if "supabase" in settings.DATABASE_URL:
    _ssl_ctx = ssl.create_default_context()
    _ssl_ctx.check_hostname = False
    _ssl_ctx.verify_mode = ssl.CERT_NONE
    _connect_args = {
        "ssl": _ssl_ctx,
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
    }

# ── Engine ─────────────────────────────────────────────────────────────────────
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=(settings.ENVIRONMENT == "development"),
    pool_size=5,        # Supabase free tier: keep pool small
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=300,   # Recycle connections every 5 min (Supabase timeout safety)
    connect_args=_connect_args,
)

# ── Session factory ────────────────────────────────────────────────────────────
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


# ── Declarative base ───────────────────────────────────────────────────────────
class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""


# ── Dependency ─────────────────────────────────────────────────────────────────
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency: yield an AsyncSession, commit on success or rollback on error."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ── Startup initialiser ────────────────────────────────────────────────────────
async def init_db() -> None:
    """Create all tables and enable pgvector extension on startup.

    NOTE: Supabase connection pooler (Transaction mode, port 6543) does not
    support DDL/extension creation reliably.  We attempt it and log failures
    gracefully — if using Supabase, enable pgvector via the dashboard instead.
    """
    # Import models so they are registered with Base.metadata
    from app.models import (  # noqa: F401  – side-effect import
        user,
        document,
        quiz,
        security_and_metrics,
    )

    try:
        async with engine.begin() as conn:
            # Try enabling pgvector (works on direct connections and via dashboard)
            try:
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
                logger.info("pgvector extension enabled.")
            except Exception as ext_err:
                logger.warning(
                    f"Could not create pgvector extension via pooler (enable it in Supabase Dashboard → Database → Extensions): {ext_err}"
                )

            await conn.run_sync(Base.metadata.create_all)
            logger.info("Database tables created (or already exist).")
    except Exception as exc:
        logger.error(f"Failed to initialise database: {exc}")
        # Don't crash — allow server to start; the tables may already exist
        logger.warning("Server will start but database operations may fail until the issue is resolved.")
