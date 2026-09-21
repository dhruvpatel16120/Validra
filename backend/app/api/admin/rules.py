"""Admin Legal Metrology rules CRUD endpoints."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_admin
from app.models.rule import Rule
from app.schemas.rule import RuleCreate, RuleListResponse, RuleResponse, RuleUpdate

router = APIRouter(prefix="/rules", tags=["Admin Rules"])


@router.get("", response_model=RuleListResponse, summary="List all rules (including inactive)")
async def admin_list_rules(
    active_only: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    stmt = select(Rule).order_by(Rule.rule_id)
    if active_only:
        stmt = stmt.where(Rule.is_active == True)
    res = await db.execute(stmt)
    rules = res.scalars().all()
    items = [RuleResponse.model_validate(r) for r in rules]
    return RuleListResponse(items=items, total=len(items))


@router.post("", response_model=RuleResponse, status_code=status.HTTP_201_CREATED, summary="Create rule")
async def admin_create_rule(
    payload: RuleCreate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    rule = Rule(
        field_name=payload.field_name.strip(),
        clause_reference=payload.clause_reference.strip(),
        description=payload.description,
        validation_type=payload.validation_type,
        applicable_categories=payload.applicable_categories,
        is_active=payload.is_active,
    )
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    return RuleResponse.model_validate(rule)


@router.patch("/{rule_id}", response_model=RuleResponse, summary="Update rule")
async def admin_update_rule(
    rule_id: int,
    payload: RuleUpdate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    stmt = select(Rule).where(Rule.rule_id == rule_id)
    res = await db.execute(stmt)
    rule = res.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found.")

    if payload.field_name is not None:
        rule.field_name = payload.field_name.strip()
    if payload.clause_reference is not None:
        rule.clause_reference = payload.clause_reference.strip()
    if payload.description is not None:
        rule.description = payload.description
    if payload.validation_type is not None:
        rule.validation_type = payload.validation_type
    if payload.applicable_categories is not None:
        rule.applicable_categories = payload.applicable_categories
    if payload.is_active is not None:
        rule.is_active = payload.is_active

    await db.commit()
    await db.refresh(rule)
    return RuleResponse.model_validate(rule)


@router.delete("/{rule_id}", summary="Delete or deactivate rule")
async def admin_delete_rule(
    rule_id: int,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    stmt = select(Rule).where(Rule.rule_id == rule_id)
    res = await db.execute(stmt)
    rule = res.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found.")

    # Soft deactivate to preserve foreign key integrity on historical scans
    rule.is_active = False
    await db.commit()
    return {"message": "Rule deactivated successfully.", "deleted": False, "deactivated": True}
