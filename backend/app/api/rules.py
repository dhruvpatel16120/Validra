"""API endpoints for Legal Metrology Rules query."""

from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.rule import Rule
from app.schemas.rule import RuleListResponse, RuleResponse

router = APIRouter(prefix="/rules", tags=["Rules"])


@router.get(
    "",
    response_model=RuleListResponse,
    summary="List active Legal Metrology rules checklist"
)
async def list_rules(
    active_only: bool = Query(True, description="Filter only currently active rules"),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve the checklist of Legal Metrology rules evaluated by the system."""
    stmt = select(Rule).order_by(Rule.rule_id)
    if active_only:
        stmt = stmt.where(Rule.is_active == True)

    res = await db.execute(stmt)
    rules = res.scalars().all()

    items = [
        RuleResponse(
            rule_id=r.rule_id,
            field_name=r.field_name,
            clause_reference=r.clause_reference,
            description=r.description,
            validation_type=r.validation_type,
            applicable_categories=r.applicable_categories or [],
            is_active=r.is_active,
            created_at=r.created_at,
            updated_at=r.updated_at,
        )
        for r in rules
    ]

    return RuleListResponse(items=items, total=len(items))
