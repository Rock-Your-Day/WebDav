"""Authentication endpoint tests."""

import pytest
from httpx import AsyncClient

from app.models.user import User
from tests.conftest import auth_header


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, admin_user: User):
    """Test successful login returns tokens."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "adminpass123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["expires_in"] > 0


@pytest.mark.asyncio
async def test_login_invalid_password(client: AsyncClient, admin_user: User):
    """Test login with wrong password returns 401."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert "Invalid username or password" in response.json()["detail"]


@pytest.mark.asyncio
async def test_login_nonexistent_user(client: AsyncClient):
    """Test login with non-existent user returns 401."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"username": "nobody", "password": "password123"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_validation_empty_username(client: AsyncClient):
    """Test login with empty username returns 422."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"username": "", "password": "password123"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_me(client: AsyncClient, admin_user: User, admin_token: str):
    """Test /auth/me returns current user info."""
    response = await client.get("/api/v1/auth/me", headers=auth_header(admin_token))
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "admin"
    assert data["role"] == "admin"


@pytest.mark.asyncio
async def test_get_me_no_token(client: AsyncClient):
    """Test /auth/me without token returns 401."""
    response = await client.get("/api/v1/auth/me")
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_get_me_invalid_token(client: AsyncClient):
    """Test /auth/me with invalid token returns 401."""
    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid-token"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient, admin_user: User):
    """Test token refresh flow."""
    # First login to get tokens
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "adminpass123"},
    )
    refresh_token = login_response.json()["refresh_token"]

    # Refresh
    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_refresh_invalid_token(client: AsyncClient):
    """Test refresh with invalid token returns 401."""
    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": "invalid-refresh-token"},
    )
    assert response.status_code == 401
