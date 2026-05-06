"""Settings and theme endpoint tests."""

import io

import pytest
from httpx import AsyncClient

from app.models.user import User
from tests.conftest import auth_header


@pytest.mark.asyncio
async def test_get_theme_public(client: AsyncClient):
    """Test theme endpoint is public (no auth required)."""
    response = await client.get("/api/v1/settings/theme")
    assert response.status_code == 200
    data = response.json()
    assert "app_name" in data
    assert "primary_color" in data
    assert "secondary_color" in data


@pytest.mark.asyncio
async def test_update_theme(client: AsyncClient, admin_user: User, admin_token: str):
    """Test admin can update theme settings."""
    response = await client.put(
        "/api/v1/settings/theme",
        headers=auth_header(admin_token),
        json={"app_name": "My Custom App", "primary_color": "#ff5722"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["app_name"] == "My Custom App"
    assert data["primary_color"] == "#ff5722"


@pytest.mark.asyncio
async def test_update_theme_invalid_color(client: AsyncClient, admin_user: User, admin_token: str):
    """Test theme rejects invalid color format."""
    response = await client.put(
        "/api/v1/settings/theme",
        headers=auth_header(admin_token),
        json={"primary_color": "not-a-color"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_update_theme_requires_admin(
    client: AsyncClient, regular_user: User, user_token: str
):
    """Test non-admin cannot update theme."""
    response = await client.put(
        "/api/v1/settings/theme",
        headers=auth_header(user_token),
        json={"app_name": "Hacked"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_upload_logo(client: AsyncClient, admin_user: User, admin_token: str):
    """Test logo upload."""
    # Create a fake PNG file (minimal valid PNG header)
    png_header = b"\x89PNG\r\n\x1a\n" + b"\x00" * 100
    response = await client.post(
        "/api/v1/settings/theme/logo",
        headers={"Authorization": f"Bearer {admin_token}"},
        files={"file": ("logo.png", io.BytesIO(png_header), "image/png")},
    )
    assert response.status_code == 200
    data = response.json()
    assert "logo_path" in data
    assert data["logo_path"].startswith("/api/v1/settings/uploads/")


@pytest.mark.asyncio
async def test_upload_logo_rejects_non_image(
    client: AsyncClient, admin_user: User, admin_token: str
):
    """Test logo upload rejects non-image files."""
    response = await client.post(
        "/api/v1/settings/theme/logo",
        headers={"Authorization": f"Bearer {admin_token}"},
        files={"file": ("script.js", io.BytesIO(b"alert('xss')"), "text/javascript")},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_upload_logo_requires_admin(client: AsyncClient, regular_user: User, user_token: str):
    """Test non-admin cannot upload logo."""
    response = await client.post(
        "/api/v1/settings/theme/logo",
        headers={"Authorization": f"Bearer {user_token}"},
        files={"file": ("logo.png", io.BytesIO(b"\x89PNG"), "image/png")},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_get_oidc_config(client: AsyncClient, admin_user: User, admin_token: str):
    """Test OIDC config endpoint."""
    response = await client.get(
        "/api/v1/settings/oidc",
        headers=auth_header(admin_token),
    )
    assert response.status_code == 200
    data = response.json()
    assert "oidc_enabled" in data
