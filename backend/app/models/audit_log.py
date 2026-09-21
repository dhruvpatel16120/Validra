"""SQLAlchemy model for Security Audit Logs."""

from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, String, Text, DateTime, JSON
from app.db.base import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(50), primary_key=True, default=lambda: f"cuid_{uuid.uuid4().hex[:16]}")
    log_code = Column(String(50), unique=True, index=True, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    user_name = Column(String(255), nullable=False)
    user_email = Column(String(255), nullable=False)
    user_role = Column(String(50), default="admin", nullable=False)
    action = Column(String(100), nullable=False, index=True)
    entity_type = Column(String(100), default="system", nullable=False)
    entity_id = Column(String(100), default="SYSTEM", nullable=False)
    ip_address = Column(String(50), default="127.0.0.1", nullable=False)
    severity = Column(String(20), default="INFO", nullable=False, index=True)
    status = Column(String(30), default="SUCCESS", nullable=False, index=True)
    description = Column(Text, nullable=False)
    metadata_json = Column("metadata", JSON, default=dict)
    acknowledged_by = Column(String(255), nullable=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
