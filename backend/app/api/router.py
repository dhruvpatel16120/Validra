"""Aggregator router mounting all Validra feature routers under /api."""

from fastapi import APIRouter

from app.api.admin import admin_router
from app.api.auth import router as auth_router
from app.api.dashboard import router as dashboard_router
from app.api.inspections import router as inspections_router
from app.api.reports import router as reports_router
from app.api.rules import router as rules_router
from app.api.scans import router as scans_router
from app.api.users import router as users_router, profile_router

router = APIRouter()

router.include_router(auth_router)
router.include_router(scans_router)
router.include_router(inspections_router)
router.include_router(reports_router)
router.include_router(rules_router)
router.include_router(dashboard_router)
router.include_router(users_router)
router.include_router(profile_router)
router.include_router(admin_router)
