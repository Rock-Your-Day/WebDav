"""OIDC configuration management endpoints."""

import json

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.oidc_config import OIDCConfig
from app.models.user import User

router = APIRouter()


class OIDCConfigRequest(BaseModel):
    enabled: bool = False
    provider_url: str | None = Field(default=None, max_length=500)
    client_id: str | None = Field(default=None, max_length=255)
    client_secret: str | None = Field(default=None, max_length=500)
    scopes: str = Field(default="openid profile email", max_length=255)
    redirect_uri: str | None = Field(default=None, max_length=500)


class RoleMappingRequest(BaseModel):
    admin_groups: list[str] = Field(default_factory=list)
    user_groups: list[str] = Field(default_factory=list)
    readonly_groups: list[str] = Field(default_factory=list)
    default_role: str = Field(default="user", pattern=r"^(admin|user|readonly)$")


@router.get("/config")
async def get_oidc_config(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Get OIDC configuration."""
    result = await db.execute(select(OIDCConfig).limit(1))
    config = result.scalar_one_or_none()

    if not config:
        return {
            "enabled": False,
            "provider_url": None,
            "client_id": None,
            "client_secret_set": False,
            "scopes": "openid profile email",
            "redirect_uri": None,
        }

    return {
        "enabled": config.enabled,
        "provider_url": config.provider_url,
        "client_id": config.client_id,
        "client_secret_set": bool(config.client_secret),
        "scopes": config.scopes,
        "redirect_uri": config.redirect_uri,
    }


@router.put("/config")
async def update_oidc_config(
    request: OIDCConfigRequest,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Update OIDC configuration. Requires app restart to take effect."""
    result = await db.execute(select(OIDCConfig).limit(1))
    config = result.scalar_one_or_none()

    if not config:
        config = OIDCConfig()
        db.add(config)

    config.enabled = request.enabled
    config.provider_url = request.provider_url
    config.client_id = request.client_id
    if request.client_secret:  # Only update if provided (don't clear on empty)
        config.client_secret = request.client_secret
    config.scopes = request.scopes
    config.redirect_uri = request.redirect_uri

    await db.flush()
    await db.refresh(config)

    return {
        "enabled": config.enabled,
        "provider_url": config.provider_url,
        "client_id": config.client_id,
        "client_secret_set": bool(config.client_secret),
        "scopes": config.scopes,
        "redirect_uri": config.redirect_uri,
        "message": "OIDC configuration saved. Restart the application to apply changes.",
    }


@router.get("/role-mapping")
async def get_role_mapping(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Get OIDC group-to-role mapping configuration."""
    result = await db.execute(select(OIDCConfig).limit(1))
    config = result.scalar_one_or_none()

    if not config or not config.role_mapping:
        return {
            "admin_groups": [],
            "user_groups": [],
            "readonly_groups": [],
            "default_role": "user",
        }

    try:
        mapping = json.loads(config.role_mapping)
    except json.JSONDecodeError:
        mapping = {}

    return {
        "admin_groups": mapping.get("admin_groups", []),
        "user_groups": mapping.get("user_groups", []),
        "readonly_groups": mapping.get("readonly_groups", []),
        "default_role": mapping.get("default_role", "user"),
    }


@router.put("/role-mapping")
async def update_role_mapping(
    request: RoleMappingRequest,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Update OIDC group-to-role mapping."""
    result = await db.execute(select(OIDCConfig).limit(1))
    config = result.scalar_one_or_none()

    if not config:
        config = OIDCConfig()
        db.add(config)

    config.role_mapping = json.dumps(
        {
            "admin_groups": request.admin_groups,
            "user_groups": request.user_groups,
            "readonly_groups": request.readonly_groups,
            "default_role": request.default_role,
        }
    )

    await db.flush()

    return {
        "admin_groups": request.admin_groups,
        "user_groups": request.user_groups,
        "readonly_groups": request.readonly_groups,
        "default_role": request.default_role,
        "message": "Role mapping saved.",
    }
