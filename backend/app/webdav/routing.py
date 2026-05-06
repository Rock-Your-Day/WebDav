"""WebDAV storage routing — resolves the correct storage path for each user.

Looks up the user's assigned storage destination from access control rules
and returns the appropriate base path for their files.
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
    Resolve the storage base path for a user.

    Logic:
    1. Look up the user's access control rules
    2. Find their primary storage destination
    3. If it's a local provider, use its configured path
    4. Otherwise fall back to default_base/{username}

    For S3/Azure backends, files still go to local staging area
    (full S3 routing requires the provider abstraction layer).
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
                return os.path.join(default_base, username)

            # Find user's storage access rules (prefer write access)
            rules_result = await session.execute(
                select(AccessControl)
                .where(AccessControl.user_id == user.id)
                .order_by(AccessControl.permission.desc())  # admin > write > read
            )
            rules = rules_result.scalars().all()

            if not rules:
                return os.path.join(default_base, username)

            # Get the first storage destination with write access
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
                        # Use the configured local path
                        local_path = storage.config.get("path", default_base)
                        user_path = os.path.join(local_path, username)
                        os.makedirs(user_path, exist_ok=True)
                        return user_path

            # Default: use the standard path
            return os.path.join(default_base, username)

    try:
        return _run_async(_resolve())
    except Exception:
        # On error, fall back to default
        return os.path.join(default_base, username)
