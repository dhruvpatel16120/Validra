"""Admin system-wide dashboard metrics endpoint."""

from collections import Counter
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import cast, desc, func, select, String
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_db, require_admin
from app.models.inspection import Inspection
from app.models.report import Report
from app.models.scan_result import ScanResult
from app.models.user import User
from app.schemas.dashboard import (
    AdminStatsResponse,
    ComplianceTrendItem,
    ViolationBreakdownItem,
)

router = APIRouter(prefix="/dashboard", tags=["Admin Dashboard"])


@router.get("", response_model=AdminStatsResponse, summary="Get system-wide metrics and KPIs")
async def admin_get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    # Total scans and outcomes
    stmt = (
        select(Inspection)
        .options(selectinload(Inspection.scan_results).selectinload(ScanResult.rule))
        .order_by(desc(Inspection.created_at))
    )
    res = await db.execute(stmt)
    inspections = res.scalars().all()

    total_scans = len(inspections)
    compliant_scans = sum(1 for i in inspections if i.overall_status == "compliant")
    flagged_scans = sum(1 for i in inspections if i.overall_status == "flagged")
    compliance_rate = round((compliant_scans / total_scans * 100), 1) if total_scans > 0 else 100.0

    today = datetime.now(timezone.utc).date()
    scans_today = sum(1 for i in inspections if i.created_at.date() == today)

    # Top violations
    violation_counts = Counter()
    violation_clauses = {}
    for insp in inspections:
        for sr in insp.scan_results:
            if sr.is_applicable and sr.is_compliant is False and sr.rule:
                name = sr.rule.field_name
                violation_counts[name] += 1
                violation_clauses[name] = sr.rule.clause_reference

    top_violations = [
        ViolationBreakdownItem(
            field_name=name,
            clause_reference=violation_clauses.get(name),
            count=count
        )
        for name, count in violation_counts.most_common(5)
    ]

    # Trend (7 days)
    trend_dict = {}
    for day_offset in range(6, -1, -1):
        day = (today - timedelta(days=day_offset)).isoformat()
        trend_dict[day] = {"total": 0, "compliant": 0, "flagged": 0}

    for insp in inspections:
        day_str = insp.created_at.date().isoformat()
        if day_str in trend_dict:
            trend_dict[day_str]["total"] += 1
            if insp.overall_status == "compliant":
                trend_dict[day_str]["compliant"] += 1
            elif insp.overall_status == "flagged":
                trend_dict[day_str]["flagged"] += 1

    trend = [
        ComplianceTrendItem(
            date=day,
            total_scans=stats["total"],
            compliant_scans=stats["compliant"],
            flagged_scans=stats["flagged"],
        )
        for day, stats in trend_dict.items()
    ]

    recent_scans = [
        {
            "scan_id": str(i.inspection_id),
            "product_name": i.product_name,
            "brand": i.brand,
            "overall_status": i.overall_status,
            "created_at": i.created_at.isoformat(),
        }
        for i in inspections[:5]
    ]

    # User counts
    users_stmt = select(func.count(User.id))
    users_res = await db.execute(users_stmt)
    total_users = users_res.scalar() or 0

    inspectors_stmt = select(func.count(User.id)).where(cast(User.role, String).ilike("%inspector%"))
    inspectors_res = await db.execute(inspectors_stmt)
    total_inspectors = inspectors_res.scalar() or 0

    # Reports counts
    reports_stmt = select(func.count(Report.report_id))
    reports_res = await db.execute(reports_stmt)
    total_reports = reports_res.scalar() or 0

    pending_stmt = select(func.count(Report.report_id)).where(Report.status.in_(["submitted", "under_review"]))
    pending_res = await db.execute(pending_stmt)
    pending_reports = pending_res.scalar() or 0

    return AdminStatsResponse(
        total_scans=total_scans,
        compliant_scans=compliant_scans,
        flagged_scans=flagged_scans,
        compliance_rate=compliance_rate,
        scans_today=scans_today,
        top_violations=top_violations,
        trend=trend,
        recent_scans=recent_scans,
        total_users=total_users,
        total_inspectors=total_inspectors,
        total_reports=total_reports,
        pending_reports=pending_reports,
    )
