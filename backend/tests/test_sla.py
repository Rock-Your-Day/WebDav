"""SLA policy endpoint tests."""

import pytest
from httpx import AsyncClient

from app.models.user import User
from tests.conftest import auth_header


@pytest.mark.asyncio
async def test_list_policies_empty(client: AsyncClient, admin_user: User, admin_token: str):
    """Test listing SLA policies when none exist."""
    response = await client.get("/api/v1/sla/policies", headers=auth_header(admin_token))
    assert response.status_code == 200
    data = response.json()
    assert data["policies"] == []
    assert data["total"] == 0


@pytest.mark.asyncio
async def test_create_policy(client: AsyncClient, admin_user: User, admin_token: str):
    """Test creating an SLA policy."""
    # Create a storage destination first
    storage_resp = await client.post(
        "/api/v1/storage/",
        headers=auth_header(admin_token),
        json={"name": "SLA Test Storage", "provider_type": "local", "config": {}},
    )
    storage_id = storage_resp.json()["id"]

    response = await client.post(
        "/api/v1/sla/policies",
        headers=auth_header(admin_token),
        json={
            "name": "Daily Backup Check",
            "storage_id": storage_id,
            "expected_frequency_hours": 24,
            "alert_email": "admin@test.com",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Daily Backup Check"
    assert data["expected_frequency_hours"] == 24
    assert data["is_active"] is True


@pytest.mark.asyncio
async def test_update_policy(client: AsyncClient, admin_user: User, admin_token: str):
    """Test updating an SLA policy."""
    # Create storage + policy
    storage_resp = await client.post(
        "/api/v1/storage/",
        headers=auth_header(admin_token),
        json={"name": "SLA Update Storage", "provider_type": "local", "config": {}},
    )
    storage_id = storage_resp.json()["id"]

    create_resp = await client.post(
        "/api/v1/sla/policies",
        headers=auth_header(admin_token),
        json={"name": "Update Me", "storage_id": storage_id, "expected_frequency_hours": 12},
    )
    policy_id = create_resp.json()["id"]

    # Update
    response = await client.put(
        f"/api/v1/sla/policies/{policy_id}",
        headers=auth_header(admin_token),
        json={"expected_frequency_hours": 48, "is_active": False},
    )
    assert response.status_code == 200
    assert response.json()["expected_frequency_hours"] == 48
    assert response.json()["is_active"] is False


@pytest.mark.asyncio
async def test_delete_policy(client: AsyncClient, admin_user: User, admin_token: str):
    """Test deleting an SLA policy."""
    storage_resp = await client.post(
        "/api/v1/storage/",
        headers=auth_header(admin_token),
        json={"name": "SLA Delete Storage", "provider_type": "local", "config": {}},
    )
    storage_id = storage_resp.json()["id"]

    create_resp = await client.post(
        "/api/v1/sla/policies",
        headers=auth_header(admin_token),
        json={"name": "Delete Me", "storage_id": storage_id, "expected_frequency_hours": 24},
    )
    policy_id = create_resp.json()["id"]

    response = await client.delete(
        f"/api/v1/sla/policies/{policy_id}",
        headers=auth_header(admin_token),
    )
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_get_violations_endpoint_exists(
    client: AsyncClient, admin_user: User, admin_token: str
):
    """Test the violations endpoint is registered and requires auth."""
    # Without auth
    response = await client.get("/api/v1/sla/violations")
    assert response.status_code in (401, 403)

    # The actual violations check uses its own DB session (not test-injectable),
    # so full testing happens in E2E against a real container.


@pytest.mark.asyncio
async def test_sla_requires_admin(client: AsyncClient, regular_user: User, user_token: str):
    """Test SLA endpoints require admin."""
    response = await client.get("/api/v1/sla/policies", headers=auth_header(user_token))
    assert response.status_code == 403
