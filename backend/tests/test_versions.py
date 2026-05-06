"""File versioning tests."""

import os
import tempfile

import pytest
from httpx import AsyncClient

from app.models.user import User
from app.services.versioning import save_version
from tests.conftest import auth_header


def test_save_version_new_file():
    """Test that save_version returns None for a new file (no previous version)."""
    with tempfile.TemporaryDirectory() as tmpdir:
        result = save_version(tmpdir, "nonexistent.txt", "admin")
        assert result is None


def test_save_version_existing_file():
    """Test that save_version saves a copy of an existing file."""
    with tempfile.TemporaryDirectory() as tmpdir:
        # Create a file
        filepath = os.path.join(tmpdir, "test.txt")
        with open(filepath, "w") as f:
            f.write("original content")

        # Save version
        result = save_version(tmpdir, "test.txt", "admin")
        assert result is not None
        assert result["file_path"] == "test.txt"
        assert result["version"] == 1
        assert result["size"] == 16  # len("original content")
        assert result["checksum"]  # SHA-256 hash
        assert result["username"] == "admin"

        # Verify version file exists
        versions_dir = os.path.join(tmpdir, ".versions")
        assert os.path.isdir(versions_dir)
        assert os.path.isfile(os.path.join(versions_dir, "test.txt.v1"))


def test_save_version_increments():
    """Test that version numbers increment correctly."""
    with tempfile.TemporaryDirectory() as tmpdir:
        filepath = os.path.join(tmpdir, "test.txt")

        # Create and version multiple times
        with open(filepath, "w") as f:
            f.write("v1 content")
        result1 = save_version(tmpdir, "test.txt")
        assert result1["version"] == 1

        with open(filepath, "w") as f:
            f.write("v2 content")
        result2 = save_version(tmpdir, "test.txt")
        assert result2["version"] == 2

        with open(filepath, "w") as f:
            f.write("v3 content")
        result3 = save_version(tmpdir, "test.txt")
        assert result3["version"] == 3


def test_save_version_subdirectory():
    """Test versioning works for files in subdirectories."""
    with tempfile.TemporaryDirectory() as tmpdir:
        subdir = os.path.join(tmpdir, "user", "docs")
        os.makedirs(subdir)
        filepath = os.path.join(subdir, "report.pdf")
        with open(filepath, "wb") as f:
            f.write(b"PDF content here")

        result = save_version(tmpdir, "user/docs/report.pdf", "bob")
        assert result is not None
        assert result["version"] == 1
        assert result["file_path"] == "user/docs/report.pdf"


@pytest.mark.asyncio
async def test_versions_api_endpoint(client: AsyncClient, admin_user: User, admin_token: str):
    """Test the versions list API endpoint."""
    response = await client.get(
        "/api/v1/versions/",
        headers=auth_header(admin_token),
        params={"file_path": "admin/test.txt"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["file_path"] == "admin/test.txt"
    assert "versions" in data
    assert "total" in data
