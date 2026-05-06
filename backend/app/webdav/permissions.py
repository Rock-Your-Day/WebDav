"""WebDAV permission checking — enforces access control rules."""

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


def check_permission(username: str, path: str, required: str = "read") -> bool:
    """
    Check if a user has the required permission for a given path.

    Permission hierarchy: admin > write > read
    Admins have full access to everything.
    Regular users need explicit access rules or access to their own directory.

    Args:
        username: The authenticated username
        path: The relative path being accessed
        required: The minimum permission needed ("read", "write", or "admin")
    """
    # Users always have full access to their own directory
    path_parts = path.strip("/").split("/")
    if path_parts and path_parts[0] == username:
        return True

    # Root listing — allow for all authenticated users (read-only)
    if not path.strip("/") and required == "read":
        return True

    async def _check():
        from sqlalchemy import select
        from app.database import async_session
        from app.models.user import User

        async with async_session() as session:
            result = await session.execute(
                select(User).where(User.username == username, User.is_active.is_(True))
            )
            user = result.scalar_one_or_none()
            if not user:
                return False

            # Admins have full access
            if user.role == "admin":
                return True

            # Check access control rules
            from app.models.access import AccessControl
            from app.models.storage import StorageDestination

            # Get all storage destinations the user has access to
            rules_result = await session.execute(
                select(AccessControl).where(AccessControl.user_id == user.id)
            )
            rules = rules_result.scalars().all()

            permission_levels = {"read": 1, "write": 2, "admin": 3}
            required_level = permission_levels.get(required, 1)

            for rule in rules:
                rule_level = permission_levels.get(rule.permission, 0)
                if rule_level >= required_level:
                    # Check path prefix if set
                    if rule.path_prefix:
                        if path.startswith(rule.path_prefix.strip("/")):
                            return True
                    else:
                        return True

            return False

    try:
        return _run_async(_check())
    except Exception:
        # On error, deny access (fail closed)
        return False


def check_quota(username: str, additional_bytes: int) -> bool:
    """
    Check if a user has enough quota remaining for a write operation.

    Returns True if the write is allowed, False if it would exceed quota.
    If the user has no quota set (None), writes are always allowed.
    """
    async def _check():
        from sqlalchemy import select, func
        from app.database import async_session
        from app.models.user import User
        from app.models.activity import ActivityLog

        async with async_session() as session:
            result = await session.execute(
                select(User).where(User.username == username, User.is_active.is_(True))
            )
            user = result.scalar_one_or_none()
            if not user:
                return False

            # No quota set = unlimited
            if user.quota_bytes is None:
                return True

            # Calculate current usage from activity logs (uploads - deletes)
            usage_result = await session.execute(
                select(func.coalesce(func.sum(ActivityLog.file_size), 0)).where(
                    ActivityLog.user_id == user.id,
                    ActivityLog.action == "upload",
                )
            )
            current_usage = usage_result.scalar() or 0

            return (current_usage + additional_bytes) <= user.quota_bytes

    try:
        return _run_async(_check())
    except Exception:
        # On error, allow the write (fail open for quota)
        return True


def ensure_user_directory(username: str, base_path: str):
    """Create the user's personal directory if it doesn't exist."""
    user_dir = os.path.join(base_path, username)
    os.makedirs(user_dir, exist_ok=True)
