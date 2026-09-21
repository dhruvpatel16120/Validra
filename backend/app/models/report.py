"""SQLAlchemy model for Violation Reports.

Represents human escalation of flagged scans to the Ministry of Consumer Affairs.
"""

from datetime import datetime, timezone
import uuid
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class Report(Base):
    __tablename__ = "reports"

    report_id = Column(
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
    reported_by = Column(String(255), nullable=True, index=True)
    status = Column(
        String(50),
        default="submitted",
        nullable=False,
        index=True
    )  # submitted, under_review, resolved, dismissed
    notes = Column(Text, nullable=True)
    email_sent = Column(Boolean, default=False, nullable=False)
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

    # Relationships
    inspection = relationship("Inspection", back_populates="reports")
