"""Pydantic schemas for Legal Metrology Rules."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class RuleBase(BaseModel):
    field_name: str
    clause_reference: str
    description: Optional[str] = None
    validation_type: str = "presence"
    applicable_categories: List[str] = ["food", "cosmetic", "general"]
    is_active: bool = True


class RuleCreate(RuleBase):
    pass


class RuleUpdate(BaseModel):
    field_name: Optional[str] = None
    clause_reference: Optional[str] = None
    description: Optional[str] = None
    validation_type: Optional[str] = None
    applicable_categories: Optional[List[str]] = None
    is_active: Optional[bool] = None


class RuleResponse(RuleBase):
    rule_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RuleListResponse(BaseModel):
    items: List[RuleResponse]
    total: int
