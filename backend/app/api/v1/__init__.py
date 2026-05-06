"""API v1 router."""

from fastapi import APIRouter

from app.api.v1 import auth, reports, storage, users
from app.api.v1 import access as access_routes
from app.api.v1 import settings as settings_routes

router = APIRouter()

router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
router.include_router(users.router, prefix="/users", tags=["Users"])
router.include_router(storage.router, prefix="/storage", tags=["Storage"])
router.include_router(access_routes.router, prefix="/access", tags=["Access Control"])
router.include_router(reports.router, prefix="/reports", tags=["Reports"])
router.include_router(settings_routes.router, prefix="/settings", tags=["Settings"])
