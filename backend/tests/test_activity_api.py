"""Activity log API endpoint tests."""

import pytest
from httpx import AsyncClient

from app.models.user import User
from tests.conftest import auth_header


@pytest.mark.asyncio
async def test_list_activity_empty(client: AsyncClient, admin_user: User, admin_token: str):
    """Test listing activity when none exists."""
    response = await client.get("/api/v1/activity/", headers=auth_header(admin_token))
    assert response.status_code == 200
    data = response.json()
    assert data["entries"] == []
    assert data["total"] == 0


@pytest.mark.asyncio
async def test_list_activity_with_filter(client: AsyncClient, admin_user: User, admin_token: str):
    """Test activity list with action filter."""
    response = await client.get(
        "/api/v1/activity/",
        headers=auth_header(admin_token),
        params={"action": "upload"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "entries" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_list_activity_pagination(client: AsyncClient, admin_user: User, admin_token: str):
    """Test activity list with pagination params."""
    response = await client.get(
        "/api/v1/activity/",
        headers=auth_header(admin_token),
        params={"skip": 0, "limit": 10},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_activity_requires_admin(client: AsyncClient, regular_user: User, user_token: str):
    """Test activity endpoint requires admin."""
    response = await client.get("/api/v1/activity/", headers=auth_header(user_token))
    assert response.status_code == 403
