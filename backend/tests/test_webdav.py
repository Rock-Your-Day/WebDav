"""WebDAV endpoint tests.

Note: Full WebDAV auth tests require a running container (E2E).
These unit tests verify the endpoint is mounted and responds.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_webdav_endpoint_mounted(client: AsyncClient):
    """Test that the WebDAV endpoint is mounted and responds."""
    # OPTIONS should work without auth and return WebDAV methods
    response = await client.request("OPTIONS", "/dav/")
    # WsgiDAV responds to OPTIONS even without auth
    assert response.status_code in (200, 401)


@pytest.mark.asyncio
async def test_webdav_requires_auth(client: AsyncClient):
    """Test that WebDAV PROPFIND requires authentication."""
    response = await client.request("PROPFIND", "/dav/", headers={"Depth": "0"})
    assert response.status_code == 401
