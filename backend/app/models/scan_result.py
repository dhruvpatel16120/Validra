"""SQLAlchemy model for per-rule Scan Results.

Stores individual evaluated findings linking a scan to a metrology rule.
"""

from datetime import datetime, timezone
import uuid
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class ScanResult(Base):
    __tablename__ = "scan_results"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    scan_id = Column(
        UUID(as_uuid=True),
        ForeignKey("inspections.inspection_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    rule_id = Column(
        Integer,
        ForeignKey("rules.rule_id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    extracted_value = Column(Text, nullable=True)
    is_applicable = Column(Boolean, default=True, nullable=False)
    is_compliant = Column(Boolean, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    inspection = relationship("Inspection", back_populates="scan_results")
    rule = relationship("Rule")
