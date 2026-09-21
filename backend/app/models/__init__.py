"""SQLAlchemy models registry."""

from app.db.base import Base
from app.models.user import User
from app.models.inspection import Inspection, Image
from app.models.rule import Rule
from app.models.scan_result import ScanResult
from app.models.report import Report

__all__ = [
    "Base",
    "User",
    "Inspection",
    "Image",
    "Rule",
    "ScanResult",
    "Report",
]
