"""SQLAlchemy model for User accounts.

Maps to the PostgreSQL 'users' table aligned with frontend Prisma schema.
"""

from datetime import datetime, timezone
import uuid
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    String,
    TypeDecorator,
)
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM
from sqlalchemy.ext.hybrid import hybrid_property

from app.db.base import Base


class UserRoleType(TypeDecorator):
    """Bridges Python strings ('inspector', 'admin') with PostgreSQL 'UserRole' enum."""
    impl = PG_ENUM("INSPECTOR", "ADMIN", name="UserRole", create_type=False)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None:
            val_upper = str(value).upper()
            if "ADMIN" in val_upper:
                return "ADMIN"
            return "INSPECTOR"
        return "INSPECTOR"

    def process_result_value(self, value, dialect):
        if value is not None:
            return str(value).lower()
        return "inspector"


class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    passwordHash = Column(String(255), nullable=True)
    fullName = Column(String(255), nullable=False)
    role = Column(UserRoleType, nullable=False, default="inspector", index=True)
    isActive = Column(Boolean, nullable=False, default=True, index=True)
    isVerified = Column(Boolean, nullable=False, default=True)
    badgeNumber = Column(String(100), nullable=True)
    jurisdiction = Column(String(255), nullable=True)
    verifyToken = Column(String(255), unique=True, nullable=True)
    verifyTokenExpiry = Column(DateTime(timezone=True), nullable=True)
    resetToken = Column(String(255), unique=True, nullable=True)
    resetTokenExpiry = Column(DateTime(timezone=True), nullable=True)
    createdAt = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    updatedAt = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Convenience snake_case hybrid properties
    @hybrid_property
    def full_name(self) -> str:
        return self.fullName

    @full_name.setter
    def full_name(self, value: str):
        self.fullName = value

    @hybrid_property
    def is_active(self) -> bool:
        return self.isActive

    @is_active.setter
    def is_active(self, value: bool):
        self.isActive = value

    @hybrid_property
    def is_verified(self) -> bool:
        return self.isVerified

    @is_verified.setter
    def is_verified(self, value: bool):
        self.isVerified = value

    @hybrid_property
    def badge_number(self) -> str:
        return self.badgeNumber

    @badge_number.setter
    def badge_number(self, value: str):
        self.badgeNumber = value

    @hybrid_property
    def created_at(self):
        return self.createdAt

    @hybrid_property
    def updated_at(self):
        return self.updatedAt
