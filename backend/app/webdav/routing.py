"""WebDAV storage routing — resolves the correct storage path for each user.

When a user connects via WebDAV, this module determines WHERE their files
are stored based on their access control rules:

1. Look up user's access control rules
2. Find their assigned storage destination with write permission
3. If it's a local provider, use its configured path
4. Create a user subdirectory within that path
5. All WebDAV operations happen in that resolved directory

This makes OpenWebDav act as a proxy — the user connects with their creds,
and files transparently go to whatever storage destination they're assigned to.
"""

import asyncio
import os
import threading
from functools import lru_cache

_local = threading.local()


def _run_async(coro):
    """Run async from sync context."""
    try:
        loop = getattr(_local, "loop", None)
        if loop is None or loop.is_closed():
            loop = asyncio.new_event_loop()
            _local.loop = loop
        return loop.run_until_complete(coro)
    except RuntimeError:
        import concurrent.futures

        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
            return pool.submit(asyncio.run, coro).result()


def resolve_user_storage_path(username: str, default_base: str) -> str:
    """
    Resolve the storage base path for a user.

    Returns the directory where this user's WebDAV files should be stored.
    The path is the user's personal directory within their assigned storage destination.

    Example:
    - Admin assigns user "tony" write access to storage "Notability Backups"
    - That storage has config.path = "/data/storage/notability"
    - This function returns "/data/storage/notability/tony"
    - All of Tony's WebDAV files go there
    """

    async def _resolve():
        from sqlalchemy import select

        from app.database import async_session
        from app.models.access import AccessControl
        from app.models.storage import StorageDestination
        from app.models.user import User

        async with async_session() as session:
            # Find user
            user_result = await session.execute(
                select(User).where(User.username == username, User.is_active.is_(True))
            )
            user = user_result.scalar_one_or_none()
            if not user:
                return _default_path(username, default_base)

            # Find user's storage access rules (prefer write/admin access)
            rules_result = await session.execute(
                select(AccessControl)
                .where(AccessControl.user_id == user.id)
                .order_by(AccessControl.permission.desc())
            )
            rules = rules_result.scalars().all()

            if not rules:
                return _default_path(username, default_base)

            # Get the first active storage destination with write access
            for rule in rules:
                if rule.permission in ("write", "admin"):
                    storage_result = await session.execute(
                        select(StorageDestination).where(
                            StorageDestination.id == rule.storage_id,
                            StorageDestination.is_active.is_(True),
                        )
                    )
                    storage = storage_result.scalar_one_or_none()
                    if storage and storage.provider_type == "local":
                        # Use the storage destination's configured path
                        storage_path = storage.config.get("path", default_base)
                        user_path = os.path.join(storage_path, username)
                        os.makedirs(user_path, exist_ok=True)
                        return user_path

            # No write-capable local storage found — use default
            return _default_path(username, default_base)

    try:
        return _run_async(_resolve())
    except Exception:
        return _default_path(username, default_base)


def _default_path(username: str, default_base: str) -> str:
    """Fall back to default storage path with user subdirectory."""
    path = os.path.join(default_base, username)
    os.makedirs(path, exist_ok=True)
    return path
