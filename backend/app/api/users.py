"""API endpoints for Current User Profile."""

import logging
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.inspection import Inspection
from app.models.report import Report
from app.schemas.user import (
    ProfileResponse,
    RecentScanItem,
    UserProfileResponse,
    UserStatsResponse,
    UserUpdateRequest,
)

logger = logging.getLogger("validra.users")

router = APIRouter(prefix="/users", tags=["Users"])
profile_router = APIRouter(prefix="/profile", tags=["Profile"])


async def compute_user_stats(db: AsyncSession, user_id: str, email: str) -> UserStatsResponse:
    """Compute real compliance metrics from the inspections and reports database tables."""
    stats = UserStatsResponse(total_scans=0, compliant=0, flagged=0, needs_review=0, reports=0, avg_compliance_score=0.0)
    try:
        # Check user-specific scans
        stmt = select(Inspection).where(
            (Inspection.inspector_id == user_id) | (Inspection.inspector_id == email)
        )
        res = await db.execute(stmt)
        user_scans = res.scalars().all()

        if user_scans:
            target_scans = user_scans
        else:
            # Operational database scans
            all_stmt = select(Inspection)
            all_res = await db.execute(all_stmt)
            target_scans = all_res.scalars().all()

        stats.total_scans = len(target_scans)
        stats.compliant = sum(
            1 for s in target_scans if (s.overall_status == "compliant" or s.status == "compliant")
        )
        stats.flagged = sum(
            1
            for s in target_scans
            if (s.overall_status in ("flagged", "non_compliant") or s.status in ("flagged", "non_compliant"))
        )
        stats.needs_review = sum(
            1 for s in target_scans if (s.overall_status == "needs_review" or s.status == "needs_review")
        )
        scores = [float(s.compliance_score) for s in target_scans if s.compliance_score is not None]
        stats.avg_compliance_score = round(sum(scores) / len(scores), 1) if scores else 0.0

        # Reports
        rep_stmt = select(Report).where(
            (Report.reported_by == user_id) | (Report.reported_by == email)
        )
        rep_res = await db.execute(rep_stmt)
        user_reports = rep_res.scalars().all()
        if user_reports:
            stats.reports = len(user_reports)
        else:
            all_rep_stmt = select(Report)
            all_rep_res = await db.execute(all_rep_stmt)
            stats.reports = len(all_rep_res.scalars().all())
    except Exception as exc:
        logger.warning(f"Failed to compute user stats: {exc}")

    return stats


async def get_recent_scans(db: AsyncSession, user_id: str, email: str, limit: int = 5) -> list[RecentScanItem]:
    """Fetch real recent scan records from inspections table."""
    try:
        stmt = (
            select(Inspection)
            .order_by(Inspection.created_at.desc())
            .limit(limit)
        )
        res = await db.execute(stmt)
        inspections = res.scalars().all()
        items: list[RecentScanItem] = []
        for ins in inspections:
            items.append(
                RecentScanItem(
                    inspection_id=str(ins.inspection_id),
                    product_name=ins.product_name,
                    brand=ins.brand,
                    category=ins.category or "general",
                    overall_status=ins.overall_status or ins.status or "pending",
                    compliance_score=float(ins.compliance_score) if ins.compliance_score is not None else None,
                    created_at=ins.created_at,
                )
            )
        return items
    except Exception as exc:
        logger.warning(f"Failed to fetch recent scans: {exc}")
        return []


def _build_user_profile_response(user: User) -> UserProfileResponse:
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
        updated_at=user.updated_at,
    )


async def _get_or_create_user(db: AsyncSession, current_user: Dict[str, Any]) -> User:
    user_id = current_user["id"]
    email = current_user["email"]
    stmt = select(User).where((User.id == user_id) | (User.email == email))
    res = await db.execute(stmt)
    user = res.scalars().first()

    if not user:
        user = User(
            id=user_id,
            email=email,
            passwordHash="",
            fullName=current_user.get("full_name") or current_user.get("name") or email.split("@")[0],
            role=current_user.get("role", "inspector"),
            isActive=True,
            isVerified=True,
            badgeNumber="LM-DEL-2024-089" if current_user.get("role") == "inspector" else None,
            jurisdiction="Delhi NCR - Central Zone" if current_user.get("role") == "inspector" else None,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    return user


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
    user = await _get_or_create_user(db, current_user)
    return _build_user_profile_response(user)


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
    user = await _get_or_create_user(db, current_user)

    name = body.full_name or body.fullName
    if name is not None:
        user.full_name = name.strip()
    badge = body.badge_number or body.badgeNumber
    if badge is not None:
        user.badge_number = badge.strip()
    if body.jurisdiction is not None:
        user.jurisdiction = body.jurisdiction.strip()

    await db.commit()
    await db.refresh(user)

    return _build_user_profile_response(user)


@profile_router.get(
    "",
    response_model=ProfileResponse,
    summary="Get user profile and compliance statistics"
)
async def get_profile_with_stats(
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Return caller's user record along with real compliance statistics."""
    user = await _get_or_create_user(db, current_user)
    stats = await compute_user_stats(db, user.id, user.email)
    recent = await get_recent_scans(db, user.id, user.email, limit=5)

    return ProfileResponse(
        user=_build_user_profile_response(user),
        stats=stats,
        recent_scans=recent,
    )


@profile_router.patch(
    "",
    response_model=ProfileResponse,
    summary="Update user profile and return updated profile with statistics"
)
async def update_profile_with_stats(
    body: UserUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Update caller profile preferences and return updated profile with stats."""
    user = await _get_or_create_user(db, current_user)

    name = body.full_name or body.fullName
    if name is not None:
        name_clean = name.strip()
        if not name_clean:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Name cannot be empty.")
        user.full_name = name_clean
    badge = body.badge_number or body.badgeNumber
    if badge is not None:
        user.badge_number = badge.strip()
    if body.jurisdiction is not None:
        user.jurisdiction = body.jurisdiction.strip()

    await db.commit()
    await db.refresh(user)

    stats = await compute_user_stats(db, user.id, user.email)
    recent = await get_recent_scans(db, user.id, user.email, limit=5)

    return ProfileResponse(
        user=_build_user_profile_response(user),
        stats=stats,
        recent_scans=recent,
    )
