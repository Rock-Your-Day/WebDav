"""Settings management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.settings import ThemeSettings
from app.models.user import User

router = APIRouter()


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
    from app.config import settings

    return {
        "oidc_enabled": settings.oidc_enabled,
        "oidc_provider_url": settings.oidc_provider_url,
        "oidc_client_id": settings.oidc_client_id,
        "oidc_scopes": settings.oidc_scopes,
    }
