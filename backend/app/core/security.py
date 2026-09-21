"""Security and JWT token verification module for NextAuth / Auth.js integration.

Implements independent cryptographic validation on the FastAPI backend for dual-security.
"""

from datetime import datetime, timezone, timedelta
from typing import Any, Dict, Optional
import logging
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

logger = logging.getLogger("validra.security")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_jwt_secret() -> str:
    """Resolve the secret used to sign NextAuth / FastAPI JWTs."""
    return settings.NEXTAUTH_SECRET or settings.AUTH_SECRET or "validra-default-jwt-secret-key-change-in-production"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against its bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)


def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create a signed JWT token (for testing or direct issuance)."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(hours=8)
    
    to_encode.update({
        "exp": int(expire.timestamp()),
        "iat": int(now.timestamp())
    })
    
    secret = get_jwt_secret()
    return jwt.encode(to_encode, secret, algorithm=settings.JWT_ALGORITHM)


def decode_and_verify_jwt(token: str) -> Dict[str, Any]:
    """Cryptographically decode and verify a JWT issued by NextAuth or FastAPI.
    
    Validates:
    - Signature integrity using shared AUTH_SECRET
    - Token expiration (exp)
    
    Returns:
        dict: Normalized user claims including user_id, email, role, and full_name.
        
    Raises:
        JWTError: If signature is invalid, token is expired, or required claims missing.
    """
    secret = get_jwt_secret()
    
    # NextAuth can use HS256, HS384, or HS512 depending on secret length
    algorithms = [settings.JWT_ALGORITHM, "HS256", "HS384", "HS512"]
    
    payload = jwt.decode(
        token,
        secret,
        algorithms=algorithms,
        options={"verify_exp": True, "verify_signature": True}
    )
    
    user_id = str(payload.get("sub") or payload.get("id") or payload.get("user_id") or "")
    email = payload.get("email") or ""
    role = str(payload.get("role") or "citizen").lower()
    full_name = payload.get("name") or payload.get("fullName") or payload.get("full_name") or ""
    
    if not user_id and not email:
        raise JWTError("Token payload missing subject identifier (sub/email)")
        
    return {
        "user_id": user_id or email,
        "email": email,
        "role": role,
        "full_name": full_name,
        "raw_payload": payload,
    }
