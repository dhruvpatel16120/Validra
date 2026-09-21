"""SQLAlchemy model for Legal Metrology Rules.

Stores the compliance checklist evaluated by the rule engine.
"""

from datetime import datetime, timezone
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Integer,
    JSON,
    String,
    Text,
)

from app.db.base import Base


class Rule(Base):
    __tablename__ = "rules"

    rule_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    field_name = Column(String(100), nullable=False, index=True)
    clause_reference = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    validation_type = Column(String(50), default="presence", nullable=False)  # presence, regex, custom
    applicable_categories = Column(JSON, default=list, nullable=False)  # ["food", "cosmetic", "general"]
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )
