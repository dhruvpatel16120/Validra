"""Pydantic schemas for User accounts, profile, and JWT verification."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class TokenVerifyRequest(BaseModel):
    token: Optional[str] = None


class TokenVerifyResponse(BaseModel):
    valid: bool
    user_id: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    full_name: Optional[str] = None
    message: Optional[str] = None


class UserProfileResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    is_verified: bool
    badge_number: Optional[str] = None
    jurisdiction: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    fullName: Optional[str] = None
    badge_number: Optional[str] = None
    badgeNumber: Optional[str] = None
    jurisdiction: Optional[str] = None


class RecentScanItem(BaseModel):
    inspection_id: str
    product_name: Optional[str] = None
    brand: Optional[str] = None
    category: str = "general"
    overall_status: str
    compliance_score: Optional[float] = None
    created_at: datetime


class UserStatsResponse(BaseModel):
    total_scans: int = 0
    compliant: int = 0
    flagged: int = 0
    needs_review: int = 0
    reports: int = 0
    avg_compliance_score: float = 0.0


class ProfileResponse(BaseModel):
    user: UserProfileResponse
    stats: UserStatsResponse
    recent_scans: list[RecentScanItem] = []


class AdminCreateUserRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "inspector"  # citizen, inspector, admin
    badge_number: Optional[str] = None
    jurisdiction: Optional[str] = None


class AdminUpdateUserRequest(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    badge_number: Optional[str] = None
    jurisdiction: Optional[str] = None
