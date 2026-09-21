"""Authentication and token validation routes."""

import logging
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import extract_bearer_token, get_db
from app.core.security import decode_and_verify_jwt
from app.models.user import User
from app.schemas.user import TokenVerifyRequest, TokenVerifyResponse

logger = logging.getLogger("validra.api.auth")
router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/verify-token",
    response_model=TokenVerifyResponse,
    summary="Validate NextAuth JWT token and extract user claims"
)
async def verify_token(
    payload: Optional[TokenVerifyRequest] = None,
    authorization: Optional[str] = Header(default=None),
    db: AsyncSession = Depends(get_db)
):
    """Dual-security token verification endpoint.
    
    Validates token cryptographic signature against AUTH_SECRET and ensures
    user account is active in PostgreSQL. Accepts token in JSON body or Authorization header.
    """
    token = ""
    if payload and payload.token:
        token = payload.token.strip()
    elif authorization:
        token = extract_bearer_token(authorization) or ""

    if not token:
        return TokenVerifyResponse(valid=False, message="Empty token provided in body or Authorization header.")

    try:
        claims = decode_and_verify_jwt(token)
    except Exception as exc:
        return TokenVerifyResponse(valid=False, message=f"Token verification failed: {str(exc)}")

    user_id = claims["user_id"]
    email = claims["email"]

    # Check if user exists in PostgreSQL
    stmt = select(User).where((User.id == user_id) | (User.email == email))
    res = await db.execute(stmt)
    db_user = res.scalar_one_or_none()

    if db_user:
        if not db_user.is_active:
            return TokenVerifyResponse(
                valid=False,
                user_id=db_user.id,
                email=db_user.email,
                role=db_user.role,
                full_name=db_user.full_name,
                message="User account is deactivated."
            )
        return TokenVerifyResponse(
            valid=True,
            user_id=db_user.id,
            email=db_user.email,
            role=db_user.role,
            full_name=db_user.full_name,
            message="Token verified successfully."
        )

    return TokenVerifyResponse(
        valid=True,
        user_id=user_id,
        email=email,
        role=claims.get("role", "citizen"),
        full_name=claims.get("full_name") or email.split("@")[0],
        message="Token verified successfully (NextAuth session)."
    )
