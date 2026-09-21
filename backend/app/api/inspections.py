"""API endpoints for Inspection oversight and inspector review."""

import logging
from pathlib import Path
from typing import Any, Dict, Optional
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import assert_can_view, get_db, get_optional_user
from app.models.inspection import Image, Inspection
from app.models.scan_result import ScanResult
from app.schemas.scan import (
    ImageMetadata,
    ScanDetailResponse,
    ScanListResponse,
    ScanRuleResult,
    ScanSummaryItem,
)

logger = logging.getLogger("validra.api.inspections")
router = APIRouter(prefix="/inspections", tags=["Inspections"])


class FindingOverrideRequest(BaseModel):
    is_compliant: bool
    remarks: Optional[str] = None


class FinalizeInspectionRequest(BaseModel):
    inspector_remarks: Optional[str] = None


@router.get(
    "",
    response_model=ScanListResponse,
    summary="List inspections with pagination and filters"
)
async def list_inspections(
    limit: int = Query(50, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    category: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_user),
):
    """Retrieve inspections viewable by the caller."""
    stmt = (
        select(Inspection)
        .options(selectinload(Inspection.scan_results))
        .order_by(desc(Inspection.created_at))
        .limit(limit)
    )

    if current_user and current_user.get("role") != "admin":
        stmt = stmt.where(
            (Inspection.inspector_id == current_user.get("id")) |
            (Inspection.inspector_id == current_user.get("email"))
        )

    if status_filter and status_filter != "all":
        stmt = stmt.where(Inspection.overall_status == status_filter)
    if category and category != "all":
        stmt = stmt.where(Inspection.category == category)

    res = await db.execute(stmt)
    inspections = res.scalars().all()

    items = []
    for insp in inspections:
        violations = sum(1 for r in insp.scan_results if r.is_applicable and r.is_compliant is False)
        passed = sum(1 for r in insp.scan_results if r.is_applicable and r.is_compliant is True)
        skipped = sum(1 for r in insp.scan_results if not r.is_applicable)

        items.append(
            ScanSummaryItem(
                scan_id=str(insp.inspection_id),
                product_name=insp.product_name,
                brand=insp.brand,
                category=insp.category,
                status=insp.status,
                overall_status=insp.overall_status,
                compliance_score=float(insp.compliance_score) if insp.compliance_score is not None else None,
                violations_count=violations,
                passed_count=passed,
                skipped_count=skipped,
                created_at=insp.created_at,
            )
        )

    return ScanListResponse(items=items, total=len(items))


@router.get(
    "/{inspection_id}",
    response_model=ScanDetailResponse,
    summary="Get full inspection detail with findings and evidence images"
)
async def get_inspection(
    inspection_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_user),
):
    """Fetch complete inspection dossier."""
    try:
        insp_uuid = uuid.UUID(inspection_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid inspection ID.")

    stmt = (
        select(Inspection)
        .options(
            selectinload(Inspection.images),
            selectinload(Inspection.scan_results).selectinload(ScanResult.rule),
        )
        .where(Inspection.inspection_id == insp_uuid)
    )
    res = await db.execute(stmt)
    inspection = res.scalar_one_or_none()

    if not inspection:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inspection not found.")

    if current_user:
        assert_can_view(inspection.inspector_id, current_user)

    images_meta = [
        ImageMetadata(
            image_id=str(img.image_id),
            panel_index=img.panel_index,
            type=img.type,
            storage_path=img.storage_path,
            url=f"/uploads/{inspection_id}/{Path(img.storage_path).name}",
            file_name=img.file_name,
            file_size=img.file_size,
            mime_type=img.mime_type,
            image_hash=img.image_hash,
            created_at=img.created_at,
        )
        for img in inspection.images
    ]

    results_meta = [
        ScanRuleResult(
            rule_id=sr.rule_id,
            field_name=sr.rule.field_name if sr.rule else None,
            clause_reference=sr.rule.clause_reference if sr.rule else None,
            description=sr.rule.description if sr.rule else None,
            extracted_value=sr.extracted_value,
            is_applicable=sr.is_applicable,
            is_compliant=sr.is_compliant,
        )
        for sr in inspection.scan_results
    ]

    return ScanDetailResponse(
        scan_id=str(inspection.inspection_id),
        product_name=inspection.product_name,
        brand=inspection.brand,
        category=inspection.category,
        status=inspection.status,
        overall_status=inspection.overall_status,
        compliance_score=float(inspection.compliance_score) if inspection.compliance_score is not None else None,
        inspector_remarks=inspection.inspector_remarks,
        created_at=inspection.created_at,
        completed_at=inspection.completed_at,
        images=images_meta,
        results=results_meta,
    )


@router.patch(
    "/{inspection_id}/findings/{finding_id}",
    summary="Override automated rule compliance decision"
)
async def override_finding(
    inspection_id: str,
    finding_id: str,
    body: FindingOverrideRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_user),
):
    """Allow inspectors to verify or override automated finding."""
    try:
        insp_uuid = uuid.UUID(inspection_id)
        f_uuid = uuid.UUID(finding_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid UUID format.")

    stmt = select(ScanResult).where(ScanResult.id == f_uuid, ScanResult.scan_id == insp_uuid)
    res = await db.execute(stmt)
    finding = res.scalar_one_or_none()

    if not finding:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Finding record not found.")

    finding.is_compliant = body.is_compliant
    await db.commit()
    return {"message": "Finding updated successfully.", "is_compliant": finding.is_compliant}


@router.post(
    "/{inspection_id}/finalize",
    summary="Finalize inspection dossier"
)
async def finalize_inspection(
    inspection_id: str,
    body: Optional[FinalizeInspectionRequest] = None,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_user),
):
    """Lock inspection and set status to finalized."""
    try:
        insp_uuid = uuid.UUID(inspection_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid inspection ID.")

    stmt = select(Inspection).where(Inspection.inspection_id == insp_uuid)
    res = await db.execute(stmt)
    insp = res.scalar_one_or_none()

    if not insp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inspection not found.")

    if current_user:
        assert_can_view(insp.inspector_id, current_user)

    insp.status = "finalized"
    insp.finalized_at = datetime.now(timezone.utc)
    if body and body.inspector_remarks:
        insp.inspector_remarks = body.inspector_remarks

    await db.commit()
    return {"message": "Inspection finalized successfully.", "status": "finalized"}


@router.get(
    "/{inspection_id}/pdf",
    summary="Download inspection certificate as PDF"
)
async def download_inspection_pdf(
    inspection_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_user),
):
    """Generate and return an official ReportLab PDF inspection audit certificate."""
    from fastapi.responses import Response
    from sqlalchemy.orm import selectinload
    from app.models.scan_result import ScanResult
    from app.services.report_service import generate_pdf_report

    try:
        insp_uuid = uuid.UUID(inspection_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid inspection ID.")

    stmt = (
        select(Inspection)
        .options(selectinload(Inspection.scan_results).selectinload(ScanResult.rule))
        .where(Inspection.inspection_id == insp_uuid)
    )
    res = await db.execute(stmt)
    insp = res.scalar_one_or_none()

    if not insp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inspection not found.")

    violations = []
    all_results = []
    for sr in insp.scan_results:
        result_dict = {
            "field_name": sr.rule.field_name if sr.rule else None,
            "clause_reference": sr.rule.clause_reference if sr.rule else None,
            "extracted_value": sr.extracted_value,
            "is_applicable": sr.is_applicable,
            "is_compliant": sr.is_compliant,
            "description": sr.rule.description if sr.rule else None,
        }
        all_results.append(result_dict)
        if sr.is_applicable and sr.is_compliant is False:
            violations.append(result_dict)

    pdf_bytes = generate_pdf_report(
        report_id=str(insp.inspection_id),
        scan_id=str(insp.inspection_id),
        product_name=insp.product_name or "Unspecified Product",
        brand=insp.brand,
        category=insp.category,
        status="compliant" if (insp.status == "compliant" or len(violations) == 0) else "flagged",
        reported_by=insp.inspector_id or "Inspector",
        reported_at=insp.created_at,
        violations=violations,
        all_results=all_results,
        compliance_score=insp.compliance_score,
    )

    filename = f"validra_inspection_{str(insp.inspection_id)[:8]}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-cache",
        },
    )

