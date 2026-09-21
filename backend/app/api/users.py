"""API endpoints for Current User Profile."""

from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.user import UserProfileResponse, UserUpdateRequest

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "/me",
    response_model=UserProfileResponse,
    summary="Get authenticated user profile"
)
async def get_my_profile(
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Return user details from database."""
    user_id = current_user["id"]
    stmt = select(User).where((User.id == user_id) | (User.email == current_user["email"]))
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User record not found.")

    return UserProfileResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        is_verified=user.is_verified,
        badge_number=user.badge_number,
        jurisdiction=user.jurisdiction,
        created_at=user.created_at,
    )


@router.patch(
    "/me",
    response_model=UserProfileResponse,
    summary="Update authenticated user profile"
)
async def update_my_profile(
    body: UserUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Update caller profile preferences."""
    user_id = current_user["id"]
    stmt = select(User).where((User.id == user_id) | (User.email == current_user["email"]))
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User record not found.")

    if body.full_name is not None:
        user.full_name = body.full_name.strip()
    if body.badge_number is not None:
        user.badge_number = body.badge_number.strip()
    if body.jurisdiction is not None:
        user.jurisdiction = body.jurisdiction.strip()

    await db.commit()
    await db.refresh(user)

    return UserProfileResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        is_verified=user.is_verified,
        badge_number=user.badge_number,
        jurisdiction=user.jurisdiction,
        created_at=user.created_at,
    )
