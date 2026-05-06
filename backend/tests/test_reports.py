"""Reports endpoint tests."""

import pytest
from httpx import AsyncClient

from app.models.user import User
from tests.conftest import auth_header


@pytest.mark.asyncio
async def test_dashboard_stats(client: AsyncClient, admin_user: User, admin_token: str):
    """Test dashboard stats endpoint."""
    response = await client.get(
        "/api/v1/reports/dashboard",
        headers=auth_header(admin_token),
    )
    assert response.status_code == 200
    data = response.json()
    assert "total_users" in data
    assert "active_users" in data
    assert "total_storage_destinations" in data
    assert "transfers_today" in data
    assert data["total_users"] >= 1  # At least the admin user


@pytest.mark.asyncio
async def test_activity_report(client: AsyncClient, admin_user: User, admin_token: str):
    """Test activity report endpoint."""
    response = await client.get(
        "/api/v1/reports/activity",
        headers=auth_header(admin_token),
        params={"days": 7},
    )
    assert response.status_code == 200
    data = response.json()
    assert "activity" in data
    assert "period_days" in data
    assert data["period_days"] == 7


@pytest.mark.asyncio
async def test_storage_usage_report(client: AsyncClient, admin_user: User, admin_token: str):
    """Test storage usage report endpoint."""
    response = await client.get(
        "/api/v1/reports/storage-usage",
        headers=auth_header(admin_token),
    )
    assert response.status_code == 200
    data = response.json()
    assert "usage" in data


@pytest.mark.asyncio
async def test_sla_compliance_report(client: AsyncClient, admin_user: User, admin_token: str):
    """Test SLA compliance report endpoint."""
    response = await client.get(
        "/api/v1/reports/sla-compliance",
        headers=auth_header(admin_token),
    )
    assert response.status_code == 200
    data = response.json()
    assert "violations" in data
    assert "compliant" in data
    assert "total_violations" in data
    assert "total_compliant" in data


@pytest.mark.asyncio
async def test_reports_require_admin(client: AsyncClient, regular_user: User, user_token: str):
    """Test all report endpoints require admin."""
    endpoints = [
        "/api/v1/reports/dashboard",
        "/api/v1/reports/activity",
        "/api/v1/reports/storage-usage",
        "/api/v1/reports/sla-compliance",
    ]
    for endpoint in endpoints:
        response = await client.get(endpoint, headers=auth_header(user_token))
        assert response.status_code == 403, f"{endpoint} should require admin"
