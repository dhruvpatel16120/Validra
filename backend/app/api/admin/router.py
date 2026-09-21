"""Admin router aggregator mounting all administrative endpoints."""

from fastapi import APIRouter

from app.api.admin.dashboard import router as dashboard_router
from app.api.admin.reports import router as reports_router
from app.api.admin.rules import router as rules_router
from app.api.admin.scans import router as scans_router
from app.api.admin.users import router as users_router

admin_router = APIRouter(prefix="/admin", tags=["Admin"])

admin_router.include_router(dashboard_router)
admin_router.include_router(users_router)
admin_router.include_router(rules_router)
admin_router.include_router(scans_router)
admin_router.include_router(reports_router)
