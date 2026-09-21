"""Database-driven Legal Metrology Rule Engine.

Evaluates extracted packaging declarations against active rules stored in PostgreSQL,
applying statutory carve-outs (weight thresholds, category limits, language rules).
"""

import logging
import re
from typing import Any, Dict, List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.rule import Rule

logger = logging.getLogger("validra.rule_engine")


def check_language_compliant(raw_text: str) -> bool:
    """Legal Metrology Rule 9(1): declarations must be in Hindi (Devanagari) or English."""
    has_devanagari = bool(re.search(r"[\u0900-\u097F]", raw_text))
    has_english = bool(re.search(r"[a-zA-Z]{3,}", raw_text))
    return has_devanagari or has_english


async def check_compliance(
    db: AsyncSession,
    extracted: Dict[str, Any],
    raw_text: str,
    package_weight_value: Optional[float] = None,
    package_weight_unit: Optional[str] = None
) -> Dict[str, Any]:
    """Evaluate compliance of extracted fields against active PostgreSQL rules.
    
    Returns:
        dict with keys:
            overall_status: "compliant" | "flagged"
            compliance_score: float (0 - 100)
            results: List[dict] (per-rule findings with clause citations)
    """
    category = (extracted.get("category") or "general").lower()
    if package_weight_value is None:
        package_weight_value = extracted.get("package_weight_value")
    if package_weight_unit is None:
        package_weight_unit = extracted.get("package_weight_unit")

    # Fetch active rules from PostgreSQL
    stmt = select(Rule).where(Rule.is_active == True).order_by(Rule.rule_id)
    result = await db.execute(stmt)
    rules = result.scalars().all()

    results = []
    applicable_count = 0
    passed_count = 0
    overall_compliant = True

    for rule in rules:
        field_name = rule.field_name
        applicable_categories = rule.applicable_categories or ["food", "cosmetic", "general"]

        is_applicable = True

        # Statutory Package Weight Exemptions:
        # Packages <= 10g or 10ml are fully exempt from mandatory declarations
        # Packages <= 20g or 20ml are exempt from all declarations except MRP and Net Quantity
        if package_weight_value is not None and package_weight_unit in ("g", "ml"):
            if package_weight_value <= 10:
                is_applicable = False
            elif package_weight_value <= 20 and field_name not in ("mrp", "net_quantity"):
                is_applicable = False

        # Commodity Category check
        if category not in applicable_categories:
            is_applicable = False

        # Field-specific evaluation
        if field_name == "dimensions":
            extracted_value = "not automatically assessed"
            is_applicable = False  # Requires manual product classification
            is_compliant = None
        elif field_name == "language":
            extracted_value = "checked_against_raw_text"
            is_compliant = check_language_compliant(raw_text) if is_applicable else None
        else:
            extracted_value = extracted.get(field_name)
            is_compliant = None
            if is_applicable:
                is_compliant = extracted_value is not None and str(extracted_value).strip() != ""

        if is_applicable:
            applicable_count += 1
            if is_compliant:
                passed_count += 1
            else:
                overall_compliant = False

        results.append({
            "rule_id": rule.rule_id,
            "field_name": field_name,
            "clause_reference": rule.clause_reference,
            "description": rule.description,
            "extracted_value": str(extracted_value) if extracted_value is not None else None,
            "is_applicable": is_applicable,
            "is_compliant": is_compliant,
        })

    # Compute compliance score (0-100%)
    compliance_score = round((passed_count / applicable_count * 100), 2) if applicable_count > 0 else 100.0

    return {
        "overall_status": "compliant" if overall_compliant else "flagged",
        "compliance_score": compliance_score,
        "results": results,
    }
