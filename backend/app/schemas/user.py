"""Pydantic schemas for User accounts, profile, and JWT verification."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class TokenVerifyRequest(BaseModel):
    token: str


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

    model_config = ConfigDict(from_attributes=True)


class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    badge_number: Optional[str] = None
    jurisdiction: Optional[str] = None


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
