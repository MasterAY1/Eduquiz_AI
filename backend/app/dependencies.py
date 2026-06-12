"""FastAPI dependencies: database sessions and current-user resolution."""

from collections.abc import AsyncGenerator

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.models.user import User
from app.utils.errors import AuthenticationError, AuthorizationError
from app.utils.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


# ── Database session ───────────────────────────────────────────────────────────


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield an async DB session; commit on success, rollback on error."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ── Current user ───────────────────────────────────────────────────────────────


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Decode the Bearer JWT and return the corresponding User.

    Raises:
        AuthenticationError: if the token is invalid or the user doesn't exist.
    """
    payload = decode_access_token(token)
    user_id: str | None = payload.get("sub")
    if not user_id:
        raise AuthenticationError("Token missing subject claim.")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise AuthenticationError("User not found.")

    from app.utils.context import user_id_ctx
    user_id_ctx.set(user.id)

    return user


async def get_current_active_user(
    user: User = Depends(get_current_user),
) -> User:
    """
    Return the current user only if their account is active.

    Raises:
        AuthorizationError: if the account is deactivated.
    """
    if not user.is_active:
        raise AuthorizationError("Account is deactivated.")
    return user
