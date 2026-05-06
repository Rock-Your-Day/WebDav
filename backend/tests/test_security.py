"""Security tests — headers, rate limiting, input validation."""

import pytest
from httpx import AsyncClient

from app.models.user import User
from tests.conftest import auth_header


@pytest.mark.asyncio
async def test_security_headers(client: AsyncClient):
    """Test that security headers are present on responses."""
    response = await client.get("/api/v1/health")
    assert response.headers.get("x-content-type-options") == "nosniff"
    assert response.headers.get("x-frame-options") == "DENY"
    assert response.headers.get("x-xss-protection") == "1; mode=block"
    assert "strict-transport-security" in response.headers
    assert "referrer-policy" in response.headers
    assert "permissions-policy" in response.headers


@pytest.mark.asyncio
async def test_cors_headers(client: AsyncClient):
    """Test CORS headers are set for allowed origins."""
    response = await client.options(
        "/api/v1/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    # CORS preflight should succeed
    assert response.status_code in (200, 204)


@pytest.mark.asyncio
async def test_unauthenticated_access_protected_endpoint(client: AsyncClient):
    """Test that protected endpoints reject unauthenticated requests."""
    response = await client.get("/api/v1/users/")
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_expired_token_rejected(client: AsyncClient):
    """Test that expired/invalid tokens are rejected."""
    response = await client.get(
        "/api/v1/users/",
        headers={"Authorization": "Bearer expired.invalid.token"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_sql_injection_in_login(client: AsyncClient):
    """Test that SQL injection attempts in login are handled safely."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"username": "' OR 1=1 --", "password": "anything"},
    )
    # Should return 401, not 500
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_xss_in_username(client: AsyncClient, admin_user: User, admin_token: str):
    """Test that XSS payloads in input are rejected by validation."""
    response = await client.post(
        "/api/v1/users/",
        headers=auth_header(admin_token),
        json={
            "username": "<script>alert('xss')</script>",
            "email": "xss@test.com",
            "password": "securepass123",
            "role": "user",
        },
    )
    # Username pattern validation should reject this
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_oversized_payload(client: AsyncClient):
    """Test that oversized payloads are handled."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"username": "a" * 10000, "password": "b" * 10000},
    )
    # Should be rejected by validation (max_length)
    assert response.status_code == 422
