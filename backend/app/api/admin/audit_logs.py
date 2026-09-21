"""Security Audit Logs & Incident Monitoring API for Administrative Oversight.

Stores and queries immutable audit records directly in PostgreSQL.
Zero dummy data.
"""

from datetime import datetime, timezone, timedelta
import io
import csv
import logging
from typing import Any, Dict, List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from pydantic import BaseModel, Field
from sqlalchemy import desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_admin
from app.models.audit_log import AuditLog

logger = logging.getLogger("validra.audit")
router = APIRouter(prefix="/audit-logs", tags=["Admin Audit Logs"])


class AuditLogItem(BaseModel):
    id: str
    timestamp: str
    user_name: str
    user_email: str
    user_role: str
    action: str
    entity_type: str
    entity_id: str
    ip_address: str
    severity: str = "INFO"  # CRITICAL, HIGH, MEDIUM, INFO
    status: str = "SUCCESS"  # SUCCESS, FAILURE, SECURITY_ALERT, ACKNOWLEDGED
    description: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[str] = None


class AuditLogStats(BaseModel):
    total_events: int
    critical_alerts: int
    high_alerts: int
    failed_logins_24h: int
    unacknowledged_alerts: int
    active_incidents: int


class AuditLogCreateRequest(BaseModel):
    action: str
    entity_type: str = "system"
    entity_id: str = "SYSTEM"
    severity: str = "INFO"
    status: str = "SUCCESS"
    description: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    ip_address: Optional[str] = None


def map_audit_log_to_item(l: AuditLog) -> AuditLogItem:
    """Format SQLAlchemy AuditLog entity to Pydantic response."""
    return AuditLogItem(
        id=l.log_code or l.id,
        timestamp=l.timestamp.isoformat() if l.timestamp else datetime.now(timezone.utc).isoformat(),
        user_name=l.user_name,
        user_email=l.user_email,
        user_role=l.user_role,
        action=l.action,
        entity_type=l.entity_type,
        entity_id=l.entity_id,
        ip_address=l.ip_address,
        severity=l.severity,
        status=l.status,
        description=l.description,
        metadata=l.metadata_json or {},
        acknowledged_by=l.acknowledged_by,
        acknowledged_at=l.acknowledged_at.isoformat() if l.acknowledged_at else None,
    )


@router.get("", response_model=List[AuditLogItem], summary="Query security audit trail")
async def list_audit_logs(
    severity: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    _admin: Dict[str, Any] = Depends(require_admin),
):
    """Retrieve filtered security audit records directly from PostgreSQL."""
    stmt = select(AuditLog).order_by(desc(AuditLog.timestamp))

    if severity and severity.upper() != "ALL":
        stmt = stmt.where(AuditLog.severity == severity.upper())

    if action and action.upper() != "ALL":
        stmt = stmt.where(AuditLog.action == action.upper())

    if status_filter and status_filter.upper() != "ALL":
        stmt = stmt.where(AuditLog.status == status_filter.upper())

    if search:
        s = f"%{search.lower().strip()}%"
        stmt = stmt.where(
            or_(
                func.lower(AuditLog.user_name).like(s),
                func.lower(AuditLog.user_email).like(s),
                func.lower(AuditLog.description).like(s),
                func.lower(AuditLog.ip_address).like(s),
                func.lower(AuditLog.log_code).like(s),
                func.lower(AuditLog.action).like(s),
            )
        )

    res = await db.execute(stmt.limit(limit))
    records = res.scalars().all()
    return [map_audit_log_to_item(r) for r in records]


@router.get("/stats", response_model=AuditLogStats, summary="Get security telemetry statistics")
async def get_audit_stats(
    db: AsyncSession = Depends(get_db),
    _admin: Dict[str, Any] = Depends(require_admin),
):
    """Return counts of security alerts and auth events directly from PostgreSQL."""
    # Total events
    res_total = await db.execute(select(func.count(AuditLog.id)))
    total = res_total.scalar_one_or_none() or 0

    # Critical alerts
    res_crit = await db.execute(select(func.count(AuditLog.id)).where(AuditLog.severity == "CRITICAL"))
    critical = res_crit.scalar_one_or_none() or 0

    # High alerts
    res_high = await db.execute(select(func.count(AuditLog.id)).where(AuditLog.severity == "HIGH"))
    high = res_high.scalar_one_or_none() or 0

    # Unacknowledged alerts
    res_unack = await db.execute(
        select(func.count(AuditLog.id)).where(
            AuditLog.status == "SECURITY_ALERT",
            AuditLog.acknowledged_by.is_(None)
        )
    )
    unack = res_unack.scalar_one_or_none() or 0

    # Failed logins in 24h
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    res_failed = await db.execute(
        select(func.count(AuditLog.id)).where(
            AuditLog.timestamp >= cutoff,
            or_(
                AuditLog.action.ilike("%FAIL%"),
                AuditLog.action.ilike("%BRUTE%"),
                AuditLog.status == "SECURITY_ALERT"
            )
        )
    )
    failed = res_failed.scalar_one_or_none() or 0

    return AuditLogStats(
        total_events=total,
        critical_alerts=critical,
        high_alerts=high,
        failed_logins_24h=failed,
        unacknowledged_alerts=unack,
        active_incidents=critical + high,
    )


@router.post("", response_model=AuditLogItem, status_code=status.HTTP_201_CREATED, summary="Log a security event")
async def create_audit_event(
    payload: AuditLogCreateRequest,
    db: AsyncSession = Depends(get_db),
    admin_user: Dict[str, Any] = Depends(require_admin),
):
    """Store a security audit record into PostgreSQL."""
    res_count = await db.execute(select(func.count(AuditLog.id)))
    current_count = res_count.scalar_one_or_none() or 0
    new_code = f"AUD-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{current_count + 1:04d}"

    entry = AuditLog(
        id=f"cuid_{uuid.uuid4().hex[:16]}",
        log_code=new_code,
        timestamp=datetime.now(timezone.utc),
        user_name=admin_user.get("full_name") or admin_user.get("email") or "System Admin",
        user_email=admin_user.get("email") or "admin@validra.gov.in",
        user_role="admin",
        action=payload.action,
        entity_type=payload.entity_type,
        entity_id=payload.entity_id,
        ip_address=payload.ip_address or "127.0.0.1",
        severity=payload.severity.upper(),
        status=payload.status.upper(),
        description=payload.description,
        metadata_json=payload.metadata,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return map_audit_log_to_item(entry)


@router.post("/{log_id}/acknowledge", response_model=AuditLogItem, summary="Acknowledge a security incident")
async def acknowledge_incident(
    log_id: str,
    db: AsyncSession = Depends(get_db),
    admin_user: Dict[str, Any] = Depends(require_admin),
):
    """Mark a security alert as acknowledged in PostgreSQL."""
    stmt = select(AuditLog).where(or_(AuditLog.id == log_id, AuditLog.log_code == log_id))
    res = await db.execute(stmt)
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audit log entry not found.")

    item.status = "ACKNOWLEDGED"
    item.acknowledged_by = admin_user.get("email") or "admin@validra.gov.in"
    item.acknowledged_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(item)
    return map_audit_log_to_item(item)


@router.get("/export", summary="Export audit trail as CSV")
async def export_audit_csv(
    db: AsyncSession = Depends(get_db),
    _admin: Dict[str, Any] = Depends(require_admin),
):
    """Generate RFC 4180 compliant CSV export directly from PostgreSQL."""
    stmt = select(AuditLog).order_by(desc(AuditLog.timestamp))
    res = await db.execute(stmt)
    records = res.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Event ID",
        "Timestamp (UTC)",
        "Actor Name",
        "Actor Email",
        "Role",
        "Severity",
        "Action Code",
        "Entity Type",
        "Entity ID",
        "IP Address",
        "Status",
        "Description",
        "Acknowledged By",
    ])

    for l in records:
        writer.writerow([
            l.log_code,
            l.timestamp.isoformat() if l.timestamp else "—",
            l.user_name,
            l.user_email,
            l.user_role,
            l.severity,
            l.action,
            l.entity_type,
            l.entity_id,
            l.ip_address,
            l.status,
            l.description,
            l.acknowledged_by or "—",
        ])

    csv_data = output.getvalue()
    filename = f"validra-audit-trail-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M')}.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
