"""Admin Scans and inspection oversight endpoints."""

import csv
import io
from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy import desc, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_db, require_admin
from app.models.inspection import Inspection
from app.schemas.scan import ScanListResponse, ScanSummaryItem

router = APIRouter(prefix="/scans", tags=["Admin Scans"])


@router.get("", response_model=ScanListResponse, summary="Query all system scans with filters")
async def admin_list_scans(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    export_csv: bool = Query(False, description="Export query results as CSV file"),
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    stmt = (
        select(Inspection)
        .options(selectinload(Inspection.scan_results))
        .order_by(desc(Inspection.created_at))
    )

    if status and status != "all":
        stmt = stmt.where(Inspection.overall_status == status)
    if category and category != "all":
        stmt = stmt.where(Inspection.category == category)
    if search:
        term = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                Inspection.product_name.ilike(term),
                Inspection.brand.ilike(term),
            )
        )

    if not export_csv:
        stmt = stmt.offset(offset).limit(limit)

    res = await db.execute(stmt)
    inspections = res.scalars().all()

    # CSV Export mode
    if export_csv:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Scan ID", "Product Name", "Brand", "Category", "Status",
            "Compliance Score", "Scanned At"
        ])
        for insp in inspections:
            writer.writerow([
                str(insp.inspection_id),
                insp.product_name or "N/A",
                insp.brand or "N/A",
                insp.category,
                insp.overall_status,
                float(insp.compliance_score) if insp.compliance_score is not None else "N/A",
                insp.created_at.isoformat() if insp.created_at else "",
            ])
        csv_data = output.getvalue()
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": 'attachment; filename="inspections_export.csv"'}
        )

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
