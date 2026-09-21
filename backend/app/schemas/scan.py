"""Pydantic schemas for Scan ingestion, execution, and history retrieval."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict


class ImageMetadata(BaseModel):
    image_id: str
    panel_index: int = 0
    type: str = "original"
    storage_path: str
    url: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    image_hash: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ScanRuleResult(BaseModel):
    rule_id: Optional[int] = None
    field_name: Optional[str] = None
    clause_reference: Optional[str] = None
    description: Optional[str] = None
    extracted_value: Optional[str] = None
    is_applicable: bool = True
    is_compliant: Optional[bool] = None

    model_config = ConfigDict(from_attributes=True)


class ScanUploadResponse(BaseModel):
    scan_id: str
    image_id: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    image_hash: Optional[str] = None
    product_name: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = "general"
    overall_status: str  # compliant | flagged | needs_review
    status: str
    ocr: Optional[Dict[str, Any]] = None
    images: List[ImageMetadata] = []
    results: List[ScanRuleResult] = []
    scanned_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ScanSummaryItem(BaseModel):
    scan_id: str
    product_name: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = "general"
    status: str
    overall_status: str
    compliance_score: Optional[float] = None
    violations_count: int = 0
    passed_count: int = 0
    skipped_count: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ScanListResponse(BaseModel):
    items: List[ScanSummaryItem]
    total: int


class ScanDetailResponse(BaseModel):
    scan_id: str
    product_name: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = "general"
    status: str
    overall_status: str
    compliance_score: Optional[float] = None
    inspector_remarks: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    images: List[ImageMetadata] = []
    results: List[ScanRuleResult] = []

    model_config = ConfigDict(from_attributes=True)
