"""Permission and quota logic tests."""

import os
import tempfile

from app.webdav.permissions import ensure_user_directory


def test_ensure_user_directory_creates_dir():
    """Test that ensure_user_directory creates the user's folder."""
    with tempfile.TemporaryDirectory() as tmpdir:
        ensure_user_directory("testuser", tmpdir)
        user_dir = os.path.join(tmpdir, "testuser")
        assert os.path.isdir(user_dir)


def test_ensure_user_directory_idempotent():
    """Test that calling ensure_user_directory twice doesn't fail."""
    with tempfile.TemporaryDirectory() as tmpdir:
        ensure_user_directory("testuser", tmpdir)
        ensure_user_directory("testuser", tmpdir)
        user_dir = os.path.join(tmpdir, "testuser")
        assert os.path.isdir(user_dir)


def test_ensure_user_directory_different_users():
    """Test multiple user directories can be created."""
    with tempfile.TemporaryDirectory() as tmpdir:
        ensure_user_directory("alice", tmpdir)
        ensure_user_directory("bob", tmpdir)
        assert os.path.isdir(os.path.join(tmpdir, "alice"))
        assert os.path.isdir(os.path.join(tmpdir, "bob"))
