"""OIDC configuration endpoint tests."""

import pytest
from httpx import AsyncClient

from app.models.user import User
from tests.conftest import auth_header


@pytest.mark.asyncio
async def test_get_oidc_config_default(client: AsyncClient, admin_user: User, admin_token: str):
    """Test getting OIDC config when none is set."""
    response = await client.get("/api/v1/oidc/config", headers=auth_header(admin_token))
    assert response.status_code == 200
    data = response.json()
    assert data["enabled"] is False
    assert data["client_secret_set"] is False


@pytest.mark.asyncio
async def test_update_oidc_config(client: AsyncClient, admin_user: User, admin_token: str):
    """Test updating OIDC configuration."""
    response = await client.put(
        "/api/v1/oidc/config",
        headers=auth_header(admin_token),
        json={
            "enabled": True,
            "provider_url": "https://keycloak.example.com/realms/test",
            "client_id": "openwebdav",
            "client_secret": "my-secret",
            "scopes": "openid profile email groups",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["enabled"] is True
    assert data["provider_url"] == "https://keycloak.example.com/realms/test"
    assert data["client_id"] == "openwebdav"
    assert data["client_secret_set"] is True
    assert "message" in data


@pytest.mark.asyncio
async def test_oidc_config_requires_admin(
    client: AsyncClient, regular_user: User, user_token: str
):
    """Test OIDC config endpoints require admin."""
    response = await client.get("/api/v1/oidc/config", headers=auth_header(user_token))
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_get_role_mapping_default(client: AsyncClient, admin_user: User, admin_token: str):
    """Test getting role mapping when none is set."""
    response = await client.get("/api/v1/oidc/role-mapping", headers=auth_header(admin_token))
    assert response.status_code == 200
    data = response.json()
    assert data["admin_groups"] == []
    assert data["default_role"] == "user"


@pytest.mark.asyncio
async def test_update_role_mapping(client: AsyncClient, admin_user: User, admin_token: str):
    """Test updating role mapping."""
    response = await client.put(
        "/api/v1/oidc/role-mapping",
        headers=auth_header(admin_token),
        json={
            "admin_groups": ["webdav-admins", "super-users"],
            "user_groups": ["webdav-users"],
            "readonly_groups": ["viewers"],
            "default_role": "readonly",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["admin_groups"] == ["webdav-admins", "super-users"]
    assert data["user_groups"] == ["webdav-users"]
    assert data["readonly_groups"] == ["viewers"]
    assert data["default_role"] == "readonly"


@pytest.mark.asyncio
async def test_role_mapping_persists(client: AsyncClient, admin_user: User, admin_token: str):
    """Test that role mapping persists after save."""
    # Save
    await client.put(
        "/api/v1/oidc/role-mapping",
        headers=auth_header(admin_token),
        json={
            "admin_groups": ["admins"],
            "user_groups": [],
            "readonly_groups": [],
            "default_role": "user",
        },
    )
    # Read back
    response = await client.get("/api/v1/oidc/role-mapping", headers=auth_header(admin_token))
    assert response.json()["admin_groups"] == ["admins"]
