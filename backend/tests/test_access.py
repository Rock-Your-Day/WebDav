"""Access control endpoint tests."""

import pytest
from httpx import AsyncClient

from app.models.user import User
from tests.conftest import auth_header


@pytest.mark.asyncio
async def test_list_access_rules_empty(client: AsyncClient, admin_user: User, admin_token: str):
    """Test listing access rules when none exist."""
    response = await client.get("/api/v1/access/", headers=auth_header(admin_token))
    assert response.status_code == 200
    data = response.json()
    assert data["rules"] == []
    assert data["total"] == 0


@pytest.mark.asyncio
async def test_create_access_rule(client: AsyncClient, admin_user: User, admin_token: str):
    """Test creating an access rule."""
    # First create a storage destination
    storage_resp = await client.post(
        "/api/v1/storage/",
        headers=auth_header(admin_token),
        json={"name": "Access Test Storage", "provider_type": "local", "config": {}},
    )
    storage_id = storage_resp.json()["id"]

    # Create access rule
    response = await client.post(
        "/api/v1/access/",
        headers=auth_header(admin_token),
        json={
            "user_id": admin_user.id,
            "storage_id": storage_id,
            "permission": "write",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["user_id"] == admin_user.id
    assert data["storage_id"] == storage_id
    assert data["permission"] == "write"


@pytest.mark.asyncio
async def test_create_duplicate_access_rule(
    client: AsyncClient, admin_user: User, admin_token: str
):
    """Test creating duplicate access rule returns 409."""
    # Create storage
    storage_resp = await client.post(
        "/api/v1/storage/",
        headers=auth_header(admin_token),
        json={"name": "Dup Access Storage", "provider_type": "local", "config": {}},
    )
    storage_id = storage_resp.json()["id"]

    # Create first rule
    await client.post(
        "/api/v1/access/",
        headers=auth_header(admin_token),
        json={"user_id": admin_user.id, "storage_id": storage_id, "permission": "read"},
    )

    # Try duplicate
    response = await client.post(
        "/api/v1/access/",
        headers=auth_header(admin_token),
        json={"user_id": admin_user.id, "storage_id": storage_id, "permission": "write"},
    )
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_delete_access_rule(client: AsyncClient, admin_user: User, admin_token: str):
    """Test deleting an access rule."""
    # Create storage + rule
    storage_resp = await client.post(
        "/api/v1/storage/",
        headers=auth_header(admin_token),
        json={"name": "Del Access Storage", "provider_type": "local", "config": {}},
    )
    storage_id = storage_resp.json()["id"]

    create_resp = await client.post(
        "/api/v1/access/",
        headers=auth_header(admin_token),
        json={"user_id": admin_user.id, "storage_id": storage_id, "permission": "read"},
    )
    rule_id = create_resp.json()["id"]

    # Delete
    response = await client.delete(
        f"/api/v1/access/{rule_id}",
        headers=auth_header(admin_token),
    )
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_access_requires_admin(client: AsyncClient, regular_user: User, user_token: str):
    """Test access control endpoints require admin."""
    response = await client.get("/api/v1/access/", headers=auth_header(user_token))
    assert response.status_code == 403
