"""API endpoints for Scan ingestion, OCR/LLM pipeline execution, and scan history."""

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import assert_can_view, get_db, get_optional_user
from app.core.config import settings
from app.models.inspection import Image, Inspection
from app.models.rule import Rule
from app.models.scan_result import ScanResult
from app.schemas.scan import (
    ImageMetadata,
    ScanDetailResponse,
    ScanListResponse,
    ScanRuleResult,
    ScanSummaryItem,
    ScanUploadResponse,
)
from app.services.extraction_service import extract_fields
from app.services.ocr_service import ocr_extract_panels
from app.services.rule_engine import check_compliance
from app.utils.image_validation import validate_and_read_image

logger = logging.getLogger("validra.api.scans")
router = APIRouter(prefix="/scans", tags=["Scans"])

MAX_SCAN_IMAGES = 4


@router.post(
    "",
    response_model=ScanUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload 1-4 label photos and run Legal Metrology compliance inspection"
)
async def upload_scan(
    images: Optional[List[UploadFile]] = File(None, description="1 to 4 photos of product packaging panels"),
    file: Optional[UploadFile] = File(None, description="Single photo fallback"),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_user),
):
    """Receive 1 to 4 label photos, run OCR.space parsing, Groq LLM extraction,

    and evaluate Legal Metrology rules against PostgreSQL.
    """
    # Consolidate input files
    upload_files: List[UploadFile] = []
    if images:
        upload_files.extend(images)
    if file and not upload_files:
        upload_files.append(file)

    if not upload_files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one product label photo is required."
        )

    if len(upload_files) > MAX_SCAN_IMAGES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A maximum of {MAX_SCAN_IMAGES} label photos may be uploaded per scan."
        )

    scan_uuid = uuid.uuid4()
    scan_id_str = str(scan_uuid)
    inspector_id = current_user.get("id") if current_user else None

    # Ensure scan storage directory exists
    scan_upload_dir = Path(settings.UPLOAD_DIR) / scan_id_str
    scan_upload_dir.mkdir(parents=True, exist_ok=True)

    image_records: List[Image] = []
    image_bytes_list: List[bytes] = []

    # 1. Validate, hash, and persist all images to local uploads
    for index, up_file in enumerate(upload_files):
        # Validate format, size (<=5MB), corruption, empty file, and extension
        content, file_hash, ext, safe_filename = await validate_and_read_image(up_file)

        file_name = f"panel_{index + 1}{ext}"
        destination = scan_upload_dir / file_name

        with open(destination, "wb") as f:
            f.write(content)

        image_record = Image(
            image_id=uuid.uuid4(),
            inspection_id=scan_uuid,
            panel_index=index,
            type="original",
            storage_path=str(destination),
            file_name=safe_filename,
            file_size=len(content),
            mime_type=up_file.content_type or f"image/{ext.lstrip('.')}",
            image_hash=file_hash,
        )
        image_records.append(image_record)
        image_bytes_list.append(content)

    # 2. Initialize Inspection record in DB
    inspection = Inspection(
        inspection_id=scan_uuid,
        inspector_id=inspector_id,
        status="processing",
        overall_status="processing",
    )
    db.add(inspection)
    for img in image_records:
        db.add(img)
    await db.commit()

    # 3. Pipeline execution: OCR.space -> Groq LLM -> Rule Engine
    try:
        # OCR across all panels
        ocr_text = ocr_extract_panels(image_bytes_list)
        
        # Groq LLM structured extraction
        extracted = extract_fields(ocr_text)

        # Rule engine evaluation against PostgreSQL active rules
        compliance_result = await check_compliance(
            db=db,
            extracted=extracted,
            raw_text=ocr_text,
            package_weight_value=extracted.get("package_weight_value"),
            package_weight_unit=extracted.get("package_weight_unit"),
        )

        overall_status = compliance_result["overall_status"]
        compliance_score = compliance_result["compliance_score"]
        rule_findings = compliance_result["results"]

        # 4. Save per-rule findings to scan_results table
        rule_results_output: List[ScanRuleResult] = []
        for finding in rule_findings:
            scan_res = ScanResult(
                id=uuid.uuid4(),
                scan_id=scan_uuid,
                rule_id=finding["rule_id"],
                extracted_value=finding["extracted_value"],
                is_applicable=finding["is_applicable"],
                is_compliant=finding["is_compliant"],
            )
            db.add(scan_res)
            rule_results_output.append(ScanRuleResult(
                rule_id=finding["rule_id"],
                field_name=finding["field_name"],
                clause_reference=finding["clause_reference"],
                description=finding["description"],
                extracted_value=finding["extracted_value"],
                is_applicable=finding["is_applicable"],
                is_compliant=finding["is_compliant"],
            ))

        # Update inspection record with final verdict
        inspection.product_name = extracted.get("commodity_name")
        inspection.brand = extracted.get("brand")
        inspection.category = extracted.get("category") or "general"
        inspection.status = overall_status
        inspection.overall_status = overall_status
        inspection.compliance_score = compliance_score
        inspection.completed_at = datetime.now(timezone.utc)

        await db.commit()
        await db.refresh(inspection)

        ocr_response_meta = {
            "status": "completed",
            "extracted_fields": extracted,
            "raw_text_length": len(ocr_text),
        }

    except Exception as exc:
        logger.error(f"Pipeline processing failed for scan {scan_id_str}: {exc}", exc_info=True)
        inspection.status = "needs_review"
        inspection.overall_status = "needs_review"
        inspection.inspector_remarks = f"Automated inspection failed: {str(exc)}"
        await db.commit()
        overall_status = "needs_review"
        rule_results_output = []
        ocr_response_meta = {
            "status": "failed",
            "error": str(exc),
        }

    # Format images response with static URLs
    images_metadata: List[ImageMetadata] = [
        ImageMetadata(
            image_id=str(img.image_id),
            panel_index=img.panel_index,
            type=img.type,
            storage_path=img.storage_path,
            url=f"/uploads/{scan_id_str}/{Path(img.storage_path).name}",
            file_name=img.file_name,
            file_size=img.file_size,
            mime_type=img.mime_type,
            image_hash=img.image_hash,
            created_at=img.created_at,
        )
        for img in image_records
    ]

    primary_image = image_records[0]

    return ScanUploadResponse(
        scan_id=scan_id_str,
        image_id=str(primary_image.image_id),
        file_name=primary_image.file_name,
        file_size=primary_image.file_size,
        image_hash=primary_image.image_hash,
        product_name=inspection.product_name,
        brand=inspection.brand,
        category=inspection.category,
        overall_status=overall_status,
        status=inspection.status,
        ocr=ocr_response_meta,
        images=images_metadata,
        results=rule_results_output,
        scanned_at=inspection.created_at,
        created_at=inspection.created_at,
    )


@router.get(
    "",
    response_model=ScanListResponse,
    summary="List caller's inspection scans"
)
async def list_scans(
    limit: int = Query(50, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    category: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_user),
):
    """Retrieve scan history. Non-admin users see only their own scans."""
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
    "/{scan_id}",
    response_model=ScanDetailResponse,
    summary="Get full inspection details, images, and rule findings"
)
async def get_scan_by_id(
    scan_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_user),
):
    """Fetch complete scan record including per-rule results and stored images."""
    try:
        scan_uuid = uuid.UUID(scan_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid scan ID format: '{scan_id}'.")

    stmt = (
        select(Inspection)
        .options(
            selectinload(Inspection.images),
            selectinload(Inspection.scan_results).selectinload(ScanResult.rule),
        )
        .where(Inspection.inspection_id == scan_uuid)
    )
    res = await db.execute(stmt)
    inspection = res.scalar_one_or_none()

    if not inspection:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Scan with ID '{scan_id}' not found.")

    if current_user:
        assert_can_view(inspection.inspector_id, current_user)

    images_meta = [
        ImageMetadata(
            image_id=str(img.image_id),
            panel_index=img.panel_index,
            type=img.type,
            storage_path=img.storage_path,
            url=f"/uploads/{scan_id}/{Path(img.storage_path).name}",
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
