"""Storage endpoint tests."""

import pytest
from httpx import AsyncClient

from app.models.user import User
from tests.conftest import auth_header


@pytest.mark.asyncio
async def test_list_storage_empty(client: AsyncClient, admin_user: User, admin_token: str):
    """Test listing storage when none exist."""
    response = await client.get("/api/v1/storage/", headers=auth_header(admin_token))
    assert response.status_code == 200
    data = response.json()
    assert data["destinations"] == []
    assert data["total"] == 0


@pytest.mark.asyncio
async def test_create_storage(client: AsyncClient, admin_user: User, admin_token: str):
    """Test creating a storage destination."""
    response = await client.post(
        "/api/v1/storage/",
        headers=auth_header(admin_token),
        json={
            "name": "My S3 Bucket",
            "provider_type": "s3",
            "config": {"bucket": "my-bucket", "region": "us-east-1"},
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "My S3 Bucket"
    assert data["provider_type"] == "s3"
    assert data["is_active"] is True


@pytest.mark.asyncio
async def test_create_storage_duplicate_name(client: AsyncClient, admin_user: User, admin_token: str):
    """Test creating storage with duplicate name returns 409."""
    # Create first
    await client.post(
        "/api/v1/storage/",
        headers=auth_header(admin_token),
        json={"name": "Duplicate", "provider_type": "local", "config": {}},
    )
    # Try duplicate
    response = await client.post(
        "/api/v1/storage/",
        headers=auth_header(admin_token),
        json={"name": "Duplicate", "provider_type": "local", "config": {}},
    )
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_create_storage_invalid_provider(client: AsyncClient, admin_user: User, admin_token: str):
    """Test creating storage with invalid provider type returns 422."""
    response = await client.post(
        "/api/v1/storage/",
        headers=auth_header(admin_token),
        json={"name": "Bad", "provider_type": "invalid", "config": {}},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_delete_storage(client: AsyncClient, admin_user: User, admin_token: str):
    """Test deleting a storage destination."""
    # Create
    create_response = await client.post(
        "/api/v1/storage/",
        headers=auth_header(admin_token),
        json={"name": "ToDelete", "provider_type": "local", "config": {}},
    )
    storage_id = create_response.json()["id"]

    # Delete
    response = await client.delete(
        f"/api/v1/storage/{storage_id}",
        headers=auth_header(admin_token),
    )
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_delete_storage_not_found(client: AsyncClient, admin_user: User, admin_token: str):
    """Test deleting non-existent storage returns 404."""
    response = await client.delete(
        "/api/v1/storage/nonexistent-id",
        headers=auth_header(admin_token),
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_storage_requires_admin(client: AsyncClient, regular_user: User, user_token: str):
    """Test storage endpoints require admin access."""
    response = await client.get("/api/v1/storage/", headers=auth_header(user_token))
    assert response.status_code == 403
