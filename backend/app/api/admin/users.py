"""Admin User management endpoints."""

from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import cast, desc, select, String
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_admin
from app.core.security import get_password_hash
from app.models.user import User
from app.schemas.user import AdminCreateUserRequest, AdminUpdateUserRequest, UserProfileResponse

router = APIRouter(prefix="/users", tags=["Admin Users"])


@router.get("", response_model=List[UserProfileResponse], summary="List all user accounts")
async def admin_list_users(
    role: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    stmt = select(User).order_by(desc(User.createdAt))
    if role and role != "all":
        stmt = stmt.where(cast(User.role, String).ilike(f"%{role.strip()}%"))
    if is_active is not None:
        stmt = stmt.where(User.isActive == is_active)

    res = await db.execute(stmt)
    users = res.scalars().all()
    return [
        UserProfileResponse(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            role=u.role,
            is_active=u.is_active,
            is_verified=u.is_verified,
            badge_number=u.badge_number,
            jurisdiction=u.jurisdiction,
            created_at=u.created_at,
        )
        for u in users
    ]


@router.post("", response_model=UserProfileResponse, status_code=status.HTTP_201_CREATED, summary="Create user account")
async def admin_create_user(
    payload: AdminCreateUserRequest,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    stmt = select(User).where(User.email == payload.email)
    res = await db.execute(stmt)
    existing = res.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered.")

    user = User(
        id=str(uuid.uuid4()),
        email=payload.email,
        passwordHash=get_password_hash(payload.password),
        fullName=payload.full_name.strip(),
        role=payload.role.lower(),
        isActive=True,
        isVerified=True,
        badgeNumber=payload.badge_number.strip() if payload.badge_number else None,
        jurisdiction=payload.jurisdiction.strip() if payload.jurisdiction else None,
    )
    db.add(user)
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


@router.get("/{user_id}", response_model=UserProfileResponse, summary="Get user account detail")
async def admin_get_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    stmt = select(User).where(User.id == user_id)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

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


@router.patch("/{user_id}", response_model=UserProfileResponse, summary="Update user account")
async def admin_update_user(
    user_id: str,
    payload: AdminUpdateUserRequest,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    stmt = select(User).where(User.id == user_id)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if payload.full_name is not None:
        user.full_name = payload.full_name.strip()
    if payload.role is not None:
        user.role = payload.role.lower()
    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.is_verified is not None:
        user.is_verified = payload.is_verified
    if payload.badge_number is not None:
        user.badge_number = payload.badge_number.strip()
    if payload.jurisdiction is not None:
        user.jurisdiction = payload.jurisdiction.strip()

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


@router.post("/{user_id}/approve", response_model=UserProfileResponse, summary="Approve inspector account")
async def admin_approve_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Approve a pending inspector account, activating and verifying them."""
    stmt = select(User).where(User.id == user_id)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    user.is_active = True
    user.is_verified = True
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


@router.delete("/{user_id}", summary="Delete user account")
async def admin_delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Delete a user account from PostgreSQL."""
    stmt = select(User).where(User.id == user_id)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    await db.delete(user)
    await db.commit()
    return {"status": "ok", "message": f"User {user.email} deleted successfully."}
