"""Pydantic schemas for Violation Reports."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class ReportViolationItem(BaseModel):
    rule_id: Optional[int] = None
    field_name: Optional[str] = None
    clause_reference: Optional[str] = None
    description: Optional[str] = None
    extracted_value: Optional[str] = None


class ReportCreateRequest(BaseModel):
    scan_id: str
    reported_by: Optional[str] = None
    notes: Optional[str] = None


class ReportStatusUpdate(BaseModel):
    status: str  # submitted, under_review, resolved, dismissed


class ReportResponse(BaseModel):
    report_id: str
    scan_id: str
    reported_by: Optional[str] = None
    status: str
    notes: Optional[str] = None
    email_sent: bool = False
    created_at: datetime
    updated_at: datetime
    product_name: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None
    violations: List[ReportViolationItem] = []

    model_config = ConfigDict(from_attributes=True)


class ReportListResponse(BaseModel):
    items: List[ReportResponse]
    total: int
