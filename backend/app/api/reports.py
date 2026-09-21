"""API endpoints for Legal Metrology violation reports and escalation."""

import logging
from typing import Any, Dict, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import assert_can_view, get_db, get_optional_user
from app.models.inspection import Inspection
from app.models.report import Report
from app.models.scan_result import ScanResult
from app.schemas.report import (
    ReportCreateRequest,
    ReportListResponse,
    ReportResponse,
    ReportViolationItem,
)
from app.services.email_service import send_violation_report_email

logger = logging.getLogger("validra.api.reports")
router = APIRouter(prefix="/reports", tags=["Reports"])


@router.post(
    "",
    response_model=ReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="File an official violation report with Consumer Affairs"
)
async def create_report(
    payload: ReportCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_user),
):
    """Escalate a flagged scan as an official violation report and trigger email alert."""
    try:
        scan_uuid = uuid.UUID(payload.scan_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid scan ID format.")

    stmt = (
        select(Inspection)
        .options(selectinload(Inspection.scan_results).selectinload(ScanResult.rule))
        .where(Inspection.inspection_id == scan_uuid)
    )
    res = await db.execute(stmt)
    inspection = res.scalar_one_or_none()

    if not inspection:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan record not found.")

    reported_by = payload.reported_by or (current_user.get("email") if current_user else "Citizen / Inspector")

    # Gather violations (applicable checks where compliant is False)
    violations = []
    violation_dicts = []
    for sr in inspection.scan_results:
        if sr.is_applicable and sr.is_compliant is False:
            item = ReportViolationItem(
                rule_id=sr.rule_id,
                field_name=sr.rule.field_name if sr.rule else None,
                clause_reference=sr.rule.clause_reference if sr.rule else None,
                description=sr.rule.description if sr.rule else None,
                extracted_value=sr.extracted_value,
            )
            violations.append(item)
            violation_dicts.append({
                "field_name": sr.rule.field_name if sr.rule else "Declaration",
                "clause_reference": sr.rule.clause_reference if sr.rule else "PCR, 2011",
                "extracted_value": sr.extracted_value,
                "description": sr.rule.description if sr.rule else "",
            })

    report_uuid = uuid.uuid4()
    report = Report(
        report_id=report_uuid,
        scan_id=scan_uuid,
        reported_by=reported_by,
        status="submitted",
        notes=payload.notes,
        email_sent=False,
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)

    # Attempt asynchronous email dispatch
    email_sent = await send_violation_report_email(
        scan_id=str(scan_uuid),
        product_name=inspection.product_name,
        brand=inspection.brand,
        category=inspection.category,
        violations=violation_dicts,
    )

    if email_sent:
        report.email_sent = True
        await db.commit()
        await db.refresh(report)

    return ReportResponse(
        report_id=str(report.report_id),
        scan_id=str(report.scan_id),
        reported_by=report.reported_by,
        status=report.status,
        notes=report.notes,
        email_sent=report.email_sent,
        created_at=report.created_at,
        updated_at=report.updated_at,
        product_name=inspection.product_name,
        brand=inspection.brand,
        category=inspection.category,
        violations=violations,
    )


@router.get(
    "",
    response_model=ReportListResponse,
    summary="List caller's filed violation reports"
)
async def list_reports(
    db: AsyncSession = Depends(get_db),
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_user),
):
    """Retrieve filed violation reports."""
    stmt = (
        select(Report)
        .options(
            selectinload(Report.inspection).selectinload(Inspection.scan_results).selectinload(ScanResult.rule)
        )
        .order_by(desc(Report.created_at))
    )

    if current_user and current_user.get("role") != "admin":
        user_identifier = current_user.get("email") or current_user.get("id")
        stmt = stmt.where(Report.reported_by == user_identifier)

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


@router.get(
    "/{report_id}",
    response_model=ReportResponse,
    summary="Get violation report details"
)
async def get_report(
    report_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_user),
):
    """Fetch one report with violations."""
    try:
        rep_uuid = uuid.UUID(report_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid report ID.")

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
