"""Admin Violation Reports Queue and review lifecycle."""

import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_db, require_admin
from app.models.inspection import Inspection
from app.models.report import Report
from app.models.scan_result import ScanResult
from app.schemas.report import (
    ReportListResponse,
    ReportResponse,
    ReportStatusUpdate,
    ReportViolationItem,
)

router = APIRouter(prefix="/reports", tags=["Admin Reports"])

ALLOWED_STATUSES = {"submitted", "under_review", "resolved", "dismissed"}


@router.get("", response_model=ReportListResponse, summary="Query violation reports review queue")
async def admin_list_reports(
    status_filter: str = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    stmt = (
        select(Report)
        .options(
            selectinload(Report.inspection).selectinload(Inspection.scan_results).selectinload(ScanResult.rule)
        )
        .order_by(desc(Report.created_at))
    )

    if status_filter and status_filter != "all":
        stmt = stmt.where(Report.status == status_filter)

    res = await db.execute(stmt)
    reports = res.scalars().all()

    items = []
    for r in reports:
        violations = []
        if r.inspection:
            for sr in r.inspection.scan_results:
                if sr.is_applicable and sr.is_compliant is False:
                    violations.append(
                        ReportViolationItem(
                            rule_id=sr.rule_id,
                            field_name=sr.rule.field_name if sr.rule else None,
                            clause_reference=sr.rule.clause_reference if sr.rule else None,
                            description=sr.rule.description if sr.rule else None,
                            extracted_value=sr.extracted_value,
                        )
                    )

        items.append(
            ReportResponse(
                report_id=str(r.report_id),
                scan_id=str(r.scan_id),
                reported_by=r.reported_by,
                status=r.status,
                notes=r.notes,
                email_sent=r.email_sent,
                created_at=r.created_at,
                updated_at=r.updated_at,
                product_name=r.inspection.product_name if r.inspection else None,
                brand=r.inspection.brand if r.inspection else None,
                category=r.inspection.category if r.inspection else None,
                violations=violations,
            )
        )

    return ReportListResponse(items=items, total=len(items))


@router.patch("/{report_id}", response_model=ReportResponse, summary="Update report review status")
async def admin_update_report_status(
    report_id: str,
    payload: ReportStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    try:
        rep_uuid = uuid.UUID(report_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid report ID.")

    new_status = payload.status.strip().lower()
    if new_status not in ALLOWED_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Status must be one of: {', '.join(sorted(ALLOWED_STATUSES))}"
        )

    stmt = (
        select(Report)
        .options(
            selectinload(Report.inspection).selectinload(Inspection.scan_results).selectinload(ScanResult.rule)
        )
        .where(Report.report_id == rep_uuid)
    )
    res = await db.execute(stmt)
    report = res.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

    report.status = new_status
    await db.commit()
    await db.refresh(report)

    violations = []
    if report.inspection:
        for sr in report.inspection.scan_results:
            if sr.is_applicable and sr.is_compliant is False:
                violations.append(
                    ReportViolationItem(
                        rule_id=sr.rule_id,
                        field_name=sr.rule.field_name if sr.rule else None,
                        clause_reference=sr.rule.clause_reference if sr.rule else None,
                        description=sr.rule.description if sr.rule else None,
                        extracted_value=sr.extracted_value,
                    )
                )

    return ReportResponse(
        report_id=str(report.report_id),
        scan_id=str(report.scan_id),
        reported_by=report.reported_by,
        status=report.status,
        notes=report.notes,
        email_sent=report.email_sent,
        created_at=report.created_at,
        updated_at=report.updated_at,
        product_name=report.inspection.product_name if report.inspection else None,
        brand=report.inspection.brand if report.inspection else None,
        category=report.inspection.category if report.inspection else None,
        violations=violations,
    )
