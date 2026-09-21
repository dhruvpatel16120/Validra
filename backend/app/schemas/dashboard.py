"""Pydantic schemas for Inspector and Admin Dashboards."""

from typing import Dict, List, Optional
from pydantic import BaseModel


class ViolationBreakdownItem(BaseModel):
    field_name: str
    clause_reference: Optional[str] = None
    count: int


class ComplianceTrendItem(BaseModel):
    date: str
    total_scans: int
    compliant_scans: int
    flagged_scans: int


class DashboardStatsResponse(BaseModel):
    total_scans: int
    compliant_scans: int
    flagged_scans: int
    compliance_rate: float
    scans_today: int
    top_violations: List[ViolationBreakdownItem] = []
    trend: List[ComplianceTrendItem] = []
    recent_scans: List[Dict] = []


class AdminStatsResponse(DashboardStatsResponse):
    total_users: int
    total_inspectors: int
    total_reports: int
    pending_reports: int
