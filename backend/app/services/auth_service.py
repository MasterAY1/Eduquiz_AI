"""Authentication service: register, login, refresh, logout, profile."""

import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.user import EducationalLevel, RefreshToken, User
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UpdateProfileRequest,
    UserResponse,
)
from app.utils.errors import AuthenticationError, NotFoundError, ValidationError
from app.utils.logger import get_logger
from app.utils.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    get_password_hash,
    hash_token,
    verify_password,
)

logger = get_logger(__name__)


class AuthService:
    """All authentication and user-profile business logic."""

    # ── Register ───────────────────────────────────────────────────────────────

    async def register(
        self, db: AsyncSession, request: RegisterRequest
    ) -> TokenResponse:
        """
        Create a new user account.

        Raises:
            ValidationError: if the email is already registered.
            ValidationError: if the educational_level is invalid.
        """
        # Check email uniqueness
        result = await db.execute(select(User).where(User.email == request.email))
        if result.scalar_one_or_none():
            raise ValidationError("An account with this email already exists.")

        # Validate educational level
        try:
            edu_level = EducationalLevel(request.educational_level)
        except ValueError:
            valid = [e.value for e in EducationalLevel]
            raise ValidationError(
                f"Invalid educational_level. Must be one of: {valid}"
            )

        user = User(
            full_name=request.full_name,
            email=request.email,
            password_hash=get_password_hash(request.password),
            educational_level=edu_level,
            school_name=request.school_name,
            department=request.department,
            class_level=request.class_level,
            preferred_subjects=request.preferred_subjects,
        )
        db.add(user)
        await db.flush()  # get user.id

        # Initialize user daily quotas
        from app.models.security_and_metrics import UserQuota
        quota = UserQuota(user_id=user.id, plan_type="free")
        db.add(quota)
        await db.flush()

        token_response = await self._issue_tokens(db, user)

        # Write compliance Audit Log
        from app.models.security_and_metrics import AuditLog
        from app.utils.context import client_ip_ctx, user_agent_ctx
        audit = AuditLog(
            user_id=user.id,
            action="register",
            status="success",
            ip_address=client_ip_ctx.get(),
            user_agent=user_agent_ctx.get(),
            details={"email": user.email},
        )
        db.add(audit)
        await db.flush()

        logger.info(f"User registered: {user.email} (id={user.id})")
        return token_response

    # ── Login ──────────────────────────────────────────────────────────────────

    async def login(self, db: AsyncSession, request: LoginRequest) -> TokenResponse:
        """
        Authenticate with email + password.

        Raises:
            AuthenticationError: if credentials are invalid.
        """
        result = await db.execute(select(User).where(User.email == request.email))
        user = result.scalar_one_or_none()

        if not user or not user.password_hash:
            raise AuthenticationError("Invalid email or password.")
        if not verify_password(request.password, user.password_hash):
            raise AuthenticationError("Invalid email or password.")
        if not user.is_active:
            raise AuthenticationError("Account is deactivated.")

        token_response = await self._issue_tokens(db, user)

        # Write compliance Audit Log
        from app.models.security_and_metrics import AuditLog
        from app.utils.context import client_ip_ctx, user_agent_ctx
        audit = AuditLog(
            user_id=user.id,
            action="login",
            status="success",
            ip_address=client_ip_ctx.get(),
            user_agent=user_agent_ctx.get(),
            details={"email": user.email},
        )
        db.add(audit)
        await db.flush()

        logger.info(f"User logged in: {user.email}")
        return token_response

    # ── Refresh ────────────────────────────────────────────────────────────────

    async def refresh_token(
        self, db: AsyncSession, token: str
    ) -> TokenResponse:
        """
        Rotate a refresh token: validate, revoke old, issue new pair.

        Raises:
            AuthenticationError: if the token is invalid, expired, or revoked.
        """
        # Decode JWT first (checks expiry & type)
        payload = decode_refresh_token(token)
        user_id = payload.get("sub")

        # Find stored token by hash
        token_hash = hash_token(token)
        result = await db.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        stored = result.scalar_one_or_none()

        if not stored:
            raise AuthenticationError("Refresh token not found.")
            
        # Compromise Detection: Token Reuse
        if stored.revoked_at is not None:
            from sqlalchemy import update
            from app.models.security_and_metrics import SystemEvent, AuditLog
            from app.utils.context import client_ip_ctx, user_agent_ctx
            
            # Immediately revoke all tokens for this user ID (Full Session Revocation)
            await db.execute(
                update(RefreshToken)
                .where(RefreshToken.user_id == stored.user_id)
                .values(revoked_at=datetime.now(tz=timezone.utc))
            )
            
            # Log critical security incident
            event = SystemEvent(
                event_type="security_violation",
                severity="critical",
                message=f"Refresh token reuse breach detected for user ID {stored.user_id}. All sessions revoked.",
                details={"compromised_token_hash": token_hash},
                user_id=stored.user_id,
            )
            db.add(event)
            
            # Log audit log
            audit = AuditLog(
                user_id=stored.user_id,
                action="token_reuse_revocation",
                status="revoked",
                ip_address=client_ip_ctx.get(),
                user_agent=user_agent_ctx.get(),
                details={"compromised_token_hash": token_hash},
            )
            db.add(audit)
            await db.commit()
            
            logger.warning(f"Security breach: Token reuse detected for user {stored.user_id}. All refresh tokens revoked.")
            raise AuthenticationError("Session compromise detected. All active sessions have been terminated.")
            
        if stored.expires_at < datetime.now(tz=timezone.utc):
            raise AuthenticationError("Refresh token has expired.")

        # Revoke old token
        stored.revoked_at = datetime.now(tz=timezone.utc)
        await db.flush()

        # Fetch user
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user or not user.is_active:
            raise AuthenticationError("User not found or deactivated.")

        token_response = await self._issue_tokens(db, user)
        logger.info(f"Token refreshed for user: {user.email}")
        return token_response

    # ── Logout ─────────────────────────────────────────────────────────────────

    async def logout(self, db: AsyncSession, token: str) -> None:
        """
        Revoke a refresh token so it cannot be reused.

        Silently succeeds if the token is not found.
        """
        token_hash = hash_token(token)
        result = await db.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        stored = result.scalar_one_or_none()
        if stored and stored.revoked_at is None:
            stored.revoked_at = datetime.now(tz=timezone.utc)
            await db.flush()

            # Write compliance Audit Log
            from app.models.security_and_metrics import AuditLog
            from app.utils.context import client_ip_ctx, user_agent_ctx
            audit = AuditLog(
                user_id=stored.user_id,
                action="logout",
                status="success",
                ip_address=client_ip_ctx.get(),
                user_agent=user_agent_ctx.get(),
                details={"token_hash": token_hash},
            )
            db.add(audit)
            await db.flush()

            logger.info(f"Refresh token revoked for user_id={stored.user_id}")

    # ── Get user ───────────────────────────────────────────────────────────────

    async def get_user_by_id(
        self, db: AsyncSession, user_id: uuid.UUID
    ) -> User:
        """
        Fetch a user by primary key.

        Raises:
            NotFoundError: if no user with that ID exists.
        """
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise NotFoundError(f"User {user_id} not found.")
        return user

    # ── Update profile ─────────────────────────────────────────────────────────

    async def update_profile(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        request: UpdateProfileRequest,
    ) -> User:
        """
        Update non-None fields on the user profile.

        Returns:
            Updated User ORM object.
        """
        user = await self.get_user_by_id(db, user_id)

        if request.full_name is not None:
            user.full_name = request.full_name
        if request.school_name is not None:
            user.school_name = request.school_name
        if request.department is not None:
            user.department = request.department
        if request.class_level is not None:
            user.class_level = request.class_level
        if request.preferred_subjects is not None:
            user.preferred_subjects = request.preferred_subjects

        await db.flush()
        logger.info(f"Profile updated for user {user_id}")
        return user

    # ── Private helpers ────────────────────────────────────────────────────────

    async def _issue_tokens(self, db: AsyncSession, user: User) -> TokenResponse:
        """Create and store a new token pair for ``user``."""
        settings = get_settings()
        token_data = {"sub": str(user.id)}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        # Persist hashed refresh token
        expires_at = datetime.now(tz=timezone.utc) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
        stored = RefreshToken(
            user_id=user.id,
            token_hash=hash_token(refresh_token),
            expires_at=expires_at,
        )
        db.add(stored)
        await db.flush()

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            user=UserResponse.model_validate(user),
        )


# Module-level singleton
auth_service = AuthService()
