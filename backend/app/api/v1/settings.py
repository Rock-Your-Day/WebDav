"""Settings management endpoints."""

import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings as app_settings
from app.database import get_db
from app.dependencies import require_admin
from app.models.settings import ThemeSettings
from app.models.user import User

router = APIRouter()

UPLOAD_DIR = "/data/uploads"


class ThemeUpdateRequest(BaseModel):
    app_name: str | None = Field(default=None, max_length=100)
    primary_color: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")
    secondary_color: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")
    dark_mode_default: bool | None = None


@router.get("/theme")
async def get_theme(db: AsyncSession = Depends(get_db)):
    """Get current theme configuration (public endpoint)."""
    result = await db.execute(select(ThemeSettings).limit(1))
    theme = result.scalar_one_or_none()

    if theme:
        return {
            "app_name": theme.app_name,
            "primary_color": theme.primary_color,
            "secondary_color": theme.secondary_color,
            "dark_mode_default": theme.dark_mode_default,
            "logo_path": theme.logo_path,
            "favicon_path": theme.favicon_path,
        }

    return {
        "app_name": "OpenWebDav",
        "primary_color": "#1976d2",
        "secondary_color": "#dc004e",
        "dark_mode_default": False,
        "logo_path": None,
        "favicon_path": None,
    }


@router.put("/theme")
async def update_theme(
    request: ThemeUpdateRequest,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Update theme configuration (admin only)."""
    result = await db.execute(select(ThemeSettings).limit(1))
    theme = result.scalar_one_or_none()

    if not theme:
        theme = ThemeSettings()
        db.add(theme)

    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(theme, field, value)

    await db.flush()
    await db.refresh(theme)

    return {
        "app_name": theme.app_name,
        "primary_color": theme.primary_color,
        "secondary_color": theme.secondary_color,
        "dark_mode_default": theme.dark_mode_default,
        "logo_path": theme.logo_path,
        "favicon_path": theme.favicon_path,
    }


@router.get("/oidc")
async def get_oidc_config(_admin: User = Depends(require_admin)):
    """Get OIDC configuration (admin only)."""
    return {
        "oidc_enabled": app_settings.oidc_enabled,
        "oidc_provider_url": app_settings.oidc_provider_url,
        "oidc_client_id": app_settings.oidc_client_id,
        "oidc_scopes": app_settings.oidc_scopes,
    }


@router.post("/theme/logo")
async def upload_logo(
    file: UploadFile,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Upload a custom logo image (admin only)."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    if file.size and file.size > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 2MB)")

    # Save file
    upload_dir = UPLOAD_DIR
    try:
        os.makedirs(upload_dir, exist_ok=True)
    except OSError:
        upload_dir = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "uploads")
        os.makedirs(upload_dir, exist_ok=True)

    ext = os.path.splitext(file.filename or "logo.png")[1] or ".png"
    filename = f"logo-{uuid.uuid4().hex[:8]}{ext}"
    filepath = os.path.join(upload_dir, filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    # Update theme settings
    result = await db.execute(select(ThemeSettings).limit(1))
    theme = result.scalar_one_or_none()
    if not theme:
        theme = ThemeSettings()
        db.add(theme)

    theme.logo_path = f"/api/v1/settings/uploads/{filename}"
    await db.flush()

    return {"logo_path": theme.logo_path, "filename": filename}


@router.post("/theme/favicon")
async def upload_favicon(
    file: UploadFile,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Upload a custom favicon (admin only)."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    upload_dir = UPLOAD_DIR
    try:
        os.makedirs(upload_dir, exist_ok=True)
    except OSError:
        upload_dir = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "uploads")
        os.makedirs(upload_dir, exist_ok=True)

    ext = os.path.splitext(file.filename or "favicon.ico")[1] or ".ico"
    filename = f"favicon-{uuid.uuid4().hex[:8]}{ext}"
    filepath = os.path.join(upload_dir, filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    result = await db.execute(select(ThemeSettings).limit(1))
    theme = result.scalar_one_or_none()
    if not theme:
        theme = ThemeSettings()
        db.add(theme)

    theme.favicon_path = f"/api/v1/settings/uploads/{filename}"
    await db.flush()

    return {"favicon_path": theme.favicon_path, "filename": filename}


@router.get("/uploads/{filename}")
async def serve_upload(filename: str):
    """Serve uploaded files (logos, favicons)."""
    from fastapi.responses import FileResponse

    # Sanitize filename
    safe_name = os.path.basename(filename)
    upload_dir = UPLOAD_DIR
    filepath = os.path.join(upload_dir, safe_name)

    if not os.path.exists(filepath):
        # Try fallback path
        upload_dir = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "uploads")
        filepath = os.path.join(upload_dir, safe_name)

    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(filepath)
