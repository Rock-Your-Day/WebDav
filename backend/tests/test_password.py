"""Password change endpoint tests."""

import pytest
from httpx import AsyncClient

from app.models.user import User
from tests.conftest import auth_header


@pytest.mark.asyncio
async def test_change_password_success(
    client: AsyncClient, admin_user: User, admin_token: str
):
    """Test successful password change."""
    response = await client.put(
        "/api/v1/users/me/password",
        headers=auth_header(admin_token),
        json={"current_password": "adminpass123", "new_password": "newpass456!"},
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Password changed successfully"

    # Verify new password works
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "newpass456!"},
    )
    assert login_resp.status_code == 200


@pytest.mark.asyncio
async def test_change_password_wrong_current(
    client: AsyncClient, admin_user: User, admin_token: str
):
    """Test password change with wrong current password."""
    response = await client.put(
        "/api/v1/users/me/password",
        headers=auth_header(admin_token),
        json={"current_password": "wrongpassword", "new_password": "newpass456!"},
    )
    assert response.status_code == 401
    assert "incorrect" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_change_password_too_short(
    client: AsyncClient, admin_user: User, admin_token: str
):
    """Test password change with too-short new password."""
    response = await client.put(
        "/api/v1/users/me/password",
        headers=auth_header(admin_token),
        json={"current_password": "adminpass123", "new_password": "short"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_change_password_requires_auth(client: AsyncClient):
    """Test password change requires authentication."""
    response = await client.put(
        "/api/v1/users/me/password",
        json={"current_password": "x", "new_password": "newpass456!"},
    )
    assert response.status_code in (401, 403)
