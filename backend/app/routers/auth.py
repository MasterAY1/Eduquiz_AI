"""Authentication API router."""

from fastapi import APIRouter, Depends, Request, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, get_current_active_user
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    RefreshRequest,
    TokenResponse,
    UpdateProfileRequest,
    UserResponse,
)
from app.services.auth_service import auth_service
from app.utils.rate_limit import limiter

router = APIRouter(tags=["auth"])


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("5/minute")
async def register(
    request: Request,
    register_data: RegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Create a new student account and issue initial auth tokens."""
    return await auth_service.register(db, register_data)


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
)
@limiter.limit("5/minute")
async def login(
    request: Request,
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Authenticate via email/password and issue new auth tokens."""
    return await auth_service.login(db, login_data)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
)
async def refresh(
    request: RefreshRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Rotate the refresh token to get a new access token and refresh token."""
    return await auth_service.refresh_token(db, request.refresh_token)


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
)
async def logout(
    request: RefreshRequest,
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """Revoke the refresh token to log out the user."""
    await auth_service.logout(db, request.refresh_token)
    return {"message": "Logged out successfully."}


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
)
async def get_me(
    current_user: User = Depends(get_current_active_user),
) -> UserResponse:
    """Retrieve the current logged-in user's profile info."""
    return UserResponse.model_validate(current_user)


@router.put(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
)
async def update_me(
    request: UpdateProfileRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Update profile details of the current logged-in user."""
    updated_user = await auth_service.update_profile(db, current_user.id, request)
    return UserResponse.model_validate(updated_user)


@router.post(
    "/me/avatar",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Upload and update the user's avatar image."""
    updated_user = await auth_service.upload_avatar(db, current_user.id, file)
    return UserResponse.model_validate(updated_user)
