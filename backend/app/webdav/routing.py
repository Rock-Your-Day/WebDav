"""WebDAV storage routing — 1:1 user-to-storage mapping.

Each user has a single assigned storage destination (user.storage_id).
When they connect via WebDAV, their files go to that destination's path.

Flow:
1. User authenticates via WebDAV
2. Look up user.storage_id → get the StorageDestination
3. Use its configured path as the base
4. Create a user subdirectory within it
5. All WebDAV operations happen there

If no storage_id is set, falls back to DEFAULT_STORAGE_PATH/{username}.
"""

import asyncio
import os
import threading

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
    Resolve the storage path for a user (1:1 mapping).

    Looks up user.storage_id → StorageDestination.config.path
    Returns: {storage_path}/{username}/
    """

    async def _resolve():
        from sqlalchemy import select

        from app.database import async_session
        from app.models.storage import StorageDestination
        from app.models.user import User

        async with async_session() as session:
            result = await session.execute(
                select(User).where(User.username == username, User.is_active.is_(True))
            )
            user = result.scalar_one_or_none()
            if not user or not user.storage_id:
                return _default_path(username, default_base)

            # Get the assigned storage destination
            storage_result = await session.execute(
                select(StorageDestination).where(
                    StorageDestination.id == user.storage_id,
                    StorageDestination.is_active.is_(True),
                )
            )
            storage = storage_result.scalar_one_or_none()
            if not storage or storage.provider_type != "local":
                return _default_path(username, default_base)

            # Use the storage destination's configured path
            storage_path = storage.config.get("path", default_base)
            user_path = os.path.join(storage_path, username)
            os.makedirs(user_path, exist_ok=True)
            return user_path

    try:
        return _run_async(_resolve())
    except Exception:
        return _default_path(username, default_base)


def _default_path(username: str, default_base: str) -> str:
    """Fall back to default storage path with user subdirectory."""
    path = os.path.join(default_base, username)
    os.makedirs(path, exist_ok=True)
    return path
