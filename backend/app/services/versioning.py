"""File versioning service.

Saves a copy of the previous file content before overwrite,
tracking version history with checksums.
"""

import hashlib
import logging
import os
import shutil

logger = logging.getLogger(__name__)


def get_versions_dir(base_path: str) -> str:
    """Get the .versions directory path within the storage base."""
    versions_dir = os.path.join(base_path, ".versions")
    os.makedirs(versions_dir, exist_ok=True)
    return versions_dir


def save_version(base_path: str, rel_path: str, username: str | None = None) -> dict | None:
    """
    Save the current file as a new version before it gets overwritten.

    Returns version metadata dict or None if file doesn't exist yet (new file).
    """
    full_path = os.path.join(base_path, rel_path.lstrip("/"))

    if not os.path.isfile(full_path):
        return None  # New file, no previous version to save

    try:
        # Calculate checksum of current file
        sha256 = hashlib.sha256()
        file_size = 0
        with open(full_path, "rb") as f:
            while chunk := f.read(8192):
                sha256.update(chunk)
                file_size += len(chunk)

        checksum = sha256.hexdigest()

        # Determine version number
        versions_dir = get_versions_dir(base_path)
        # Store versions as: .versions/{rel_path}.v{N}
        safe_name = rel_path.strip("/").replace("/", "__")
        existing = [f for f in os.listdir(versions_dir) if f.startswith(f"{safe_name}.v")]
        version_num = len(existing) + 1

        # Copy current file to versions directory
        version_filename = f"{safe_name}.v{version_num}"
        version_path = os.path.join(versions_dir, version_filename)
        shutil.copy2(full_path, version_path)

        logger.info(f"Saved version {version_num} of {rel_path} ({file_size} bytes)")

        return {
            "file_path": rel_path,
            "version": version_num,
            "size": file_size,
            "checksum": checksum,
            "username": username,
        }

    except Exception as e:
        logger.error(f"Failed to save version of {rel_path}: {e}")
        return None


def record_version_in_db(version_data: dict):
    """Record the version metadata in the database (async bridge)."""
    import asyncio
    import threading

    _local = threading.local()

    async def _save():
        from sqlalchemy import select

        from app.database import async_session
        from app.models.activity import FileVersion
        from app.models.user import User

        async with async_session() as session:
            # Look up user ID
            user_id = None
            if version_data.get("username"):
                result = await session.execute(
                    select(User.id).where(User.username == version_data["username"])
                )
                user_id = result.scalar_one_or_none()

            version = FileVersion(
                storage_id=version_data.get("storage_id", "local"),
                file_path=version_data["file_path"],
                version=version_data["version"],
                size=version_data["size"],
                checksum=version_data["checksum"],
                created_by=user_id,
            )
            session.add(version)
            await session.commit()

    try:
        loop = getattr(_local, "loop", None)
        if loop is None or loop.is_closed():
            loop = asyncio.new_event_loop()
            _local.loop = loop
        loop.run_until_complete(_save())
    except Exception as e:
        logger.error(f"Failed to record version in DB: {e}")
