"""User management endpoint tests."""

import pytest
from httpx import AsyncClient

from app.models.user import User
from tests.conftest import auth_header


@pytest.mark.asyncio
async def test_list_users_admin(client: AsyncClient, admin_user: User, admin_token: str):
    """Test admin can list users."""
    response = await client.get("/api/v1/users/", headers=auth_header(admin_token))
    assert response.status_code == 200
    data = response.json()
    assert "users" in data
    assert "total" in data
    assert data["total"] >= 1


@pytest.mark.asyncio
async def test_list_users_non_admin(client: AsyncClient, regular_user: User, user_token: str):
    """Test non-admin cannot list users."""
    response = await client.get("/api/v1/users/", headers=auth_header(user_token))
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_user(client: AsyncClient, admin_user: User, admin_token: str):
    """Test admin can create a user."""
    response = await client.post(
        "/api/v1/users/",
        headers=auth_header(admin_token),
        json={
            "username": "newuser",
            "email": "newuser@test.com",
            "password": "securepass123",
            "role": "user",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "newuser"
    assert data["email"] == "newuser@test.com"
    assert data["role"] == "user"
    assert data["is_active"] is True


@pytest.mark.asyncio
async def test_create_user_duplicate_username(client: AsyncClient, admin_user: User, admin_token: str):
    """Test creating user with duplicate username returns 409."""
    response = await client.post(
        "/api/v1/users/",
        headers=auth_header(admin_token),
        json={
            "username": "admin",
            "email": "other@test.com",
            "password": "securepass123",
            "role": "user",
        },
    )
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_create_user_invalid_username(client: AsyncClient, admin_user: User, admin_token: str):
    """Test creating user with invalid username returns 422."""
    response = await client.post(
        "/api/v1/users/",
        headers=auth_header(admin_token),
        json={
            "username": "bad user!",
            "email": "bad@test.com",
            "password": "securepass123",
            "role": "user",
        },
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_user_short_password(client: AsyncClient, admin_user: User, admin_token: str):
    """Test creating user with short password returns 422."""
    response = await client.post(
        "/api/v1/users/",
        headers=auth_header(admin_token),
        json={
            "username": "shortpw",
            "email": "short@test.com",
            "password": "123",
            "role": "user",
        },
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_user_self(client: AsyncClient, regular_user: User, user_token: str):
    """Test user can view their own profile."""
    response = await client.get(
        f"/api/v1/users/{regular_user.id}",
        headers=auth_header(user_token),
    )
    assert response.status_code == 200
    assert response.json()["username"] == "testuser"


@pytest.mark.asyncio
async def test_get_user_other_forbidden(
    client: AsyncClient, admin_user: User, regular_user: User, user_token: str
):
    """Test non-admin cannot view other users."""
    response = await client.get(
        f"/api/v1/users/{admin_user.id}",
        headers=auth_header(user_token),
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_delete_user(client: AsyncClient, admin_user: User, regular_user: User, admin_token: str):
    """Test admin can delete a user."""
    response = await client.delete(
        f"/api/v1/users/{regular_user.id}",
        headers=auth_header(admin_token),
    )
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_delete_self_forbidden(client: AsyncClient, admin_user: User, admin_token: str):
    """Test admin cannot delete themselves."""
    response = await client.delete(
        f"/api/v1/users/{admin_user.id}",
        headers=auth_header(admin_token),
    )
    assert response.status_code == 400
