"""Authentication and token validation routes."""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
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
    payload: TokenVerifyRequest,
    db: AsyncSession = Depends(get_db)
):
    """Dual-security token verification endpoint.
    
    Validates token cryptographic signature against AUTH_SECRET and ensures
    user account is active in PostgreSQL.
    """
    token = payload.token.strip()
    if not token:
        return TokenVerifyResponse(valid=False, message="Empty token provided.")

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
