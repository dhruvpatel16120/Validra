"""API endpoints for Inspector dashboard statistics and trends."""

from collections import Counter
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_db, get_optional_user
from app.models.inspection import Inspection
from app.models.scan_result import ScanResult
from app.schemas.dashboard import (
    ComplianceTrendItem,
    DashboardStatsResponse,
    ViolationBreakdownItem,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get(
    "",
    response_model=DashboardStatsResponse,
    summary="Get caller's inspection metrics, trends, and violation breakdown"
)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_user),
):
    """Aggregate real-time inspection metrics for dashboard visualization."""
    base_stmt = select(Inspection).options(
        selectinload(Inspection.scan_results).selectinload(ScanResult.rule)
    )

    if current_user and current_user.get("role") != "admin":
        user_id = current_user.get("id")
        email = current_user.get("email")
        base_stmt = base_stmt.where((Inspection.inspector_id == user_id) | (Inspection.inspector_id == email))

    res = await db.execute(base_stmt.order_by(desc(Inspection.created_at)))
    inspections = res.scalars().all()

    total_scans = len(inspections)
    compliant_scans = sum(1 for i in inspections if i.overall_status == "compliant")
    flagged_scans = sum(1 for i in inspections if i.overall_status == "flagged")
    compliance_rate = round((compliant_scans / total_scans * 100), 1) if total_scans > 0 else 100.0

    today = datetime.now(timezone.utc).date()
    scans_today = sum(1 for i in inspections if i.created_at.date() == today)

    # Top violations aggregation
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

    # 7-day trend
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

    return DashboardStatsResponse(
        total_scans=total_scans,
        compliant_scans=compliant_scans,
        flagged_scans=flagged_scans,
        compliance_rate=compliance_rate,
        scans_today=scans_today,
        top_violations=top_violations,
        trend=trend,
        recent_scans=recent_scans,
    )
