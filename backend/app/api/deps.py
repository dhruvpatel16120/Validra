"""Authentication and database dependencies for FastAPI routes.

Verifies NextAuth / Auth.js JWT tokens, verifies user active status in PostgreSQL,
and enforces Role-Based Access Control (RBAC).
"""

import logging
from typing import Any, AsyncGenerator, Dict, Optional
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_and_verify_jwt
from app.db.session import AsyncSessionLocal
from app.models.user import User

logger = logging.getLogger("validra.deps")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency to provide an async database session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


def extract_bearer_token(authorization: Optional[str]) -> Optional[str]:
    """Extract token string from 'Authorization: Bearer <token>' header."""
    if not authorization:
        return None
    parts = authorization.split(None, 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    token = parts[1].strip()
    return token or None


async def get_optional_user(
    authorization: Optional[str] = Header(default=None),
    db: AsyncSession = Depends(get_db)
) -> Optional[Dict[str, Any]]:
    """Resolve authenticated user if Authorization header is present, else None."""
    token = extract_bearer_token(authorization)
    if not token:
        return None

    try:
        claims = decode_and_verify_jwt(token)
    except Exception as exc:
        logger.debug(f"Optional token validation failed: {exc}")
        return None

    user_id = claims["user_id"]
    email = claims["email"]

    # Verify user record in PostgreSQL if exists
    stmt = select(User).where((User.id == user_id) | (User.email == email))
    res = await db.execute(stmt)
    db_user = res.scalar_one_or_none()

    if db_user:
        return {
            "id": db_user.id,
            "email": db_user.email,
            "full_name": db_user.full_name,
            "role": db_user.role.lower(),
            "is_active": db_user.is_active,
            "is_verified": db_user.is_verified,
        }

    return {
        "id": user_id,
        "email": email,
        "full_name": claims.get("full_name") or email.split("@")[0],
        "role": claims.get("role", "citizen").lower(),
        "is_active": True,
        "is_verified": True,
    }


async def get_current_user(
    authorization: Optional[str] = Header(default=None),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Validate Bearer JWT and ensure user is active in PostgreSQL.
    
    Raises 401 Unauthorized if token is missing or invalid.
    Raises 403 Forbidden if account is deactivated.
    """
    token = extract_bearer_token(authorization)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header with Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        claims = decode_and_verify_jwt(token)
    except Exception as exc:
        logger.warning(f"JWT verification failed: {exc}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired access token: {str(exc)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = claims["user_id"]
    email = claims["email"]

    # Query PostgreSQL to verify active status
    stmt = select(User).where((User.id == user_id) | (User.email == email))
    res = await db.execute(stmt)
    db_user = res.scalars().first()

    if db_user:
        if not db_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is deactivated. Please contact an administrator.",
            )
        return {
            "id": db_user.id,
            "email": db_user.email,
            "full_name": db_user.full_name,
            "role": db_user.role.lower(),
            "is_active": db_user.is_active,
            "is_verified": db_user.is_verified,
        }

    # If authenticated via valid NextAuth token but not yet in PostgreSQL DB:
    return {
        "id": user_id,
        "email": email,
        "full_name": claims.get("full_name") or email.split("@")[0],
        "role": claims.get("role", "citizen").lower(),
        "is_active": True,
        "is_verified": True,
    }


async def require_admin(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Dependency that restricts endpoint access strictly to admin users."""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator permissions required to access this resource.",
        )
    return current_user


async def require_inspector(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Dependency restricting endpoint access to inspectors and administrators."""
    if current_user.get("role") not in ("inspector", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inspector permissions required to perform this action.",
        )
    return current_user


def assert_can_view(scan_inspector_id: Optional[str], user: Dict[str, Any]) -> None:
    """Assert caller owns the scan or is an administrator."""
    if user.get("role") == "admin":
        return
    if scan_inspector_id and scan_inspector_id != user.get("id") and scan_inspector_id != user.get("email"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view or manage this inspection record.",
        )
