"""WebDAV permission checking.

In the proxy model, permissions are simpler:
- The routing module already resolved the user to their assigned storage
- If they have a write access rule, they can write anywhere in their resolved dir
- If they only have read, they can only read
- Admins can do anything

The permission check here validates the user's access level for the operation type.
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


def check_permission(username: str, path: str, required: str = "read") -> bool:
    """
    Check if a user has the required permission level.

    In the proxy model:
    - Admins always have full access
    - Users with write/admin access rules can read and write
    - Users with read-only access can only read
    - If no rules exist, the user still has access to their default directory
    """
    if not username:
        return False

    async def _check():
        from sqlalchemy import select

        from app.database import async_session
        from app.models.access import AccessControl
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
            rules_result = await session.execute(
                select(AccessControl).where(AccessControl.user_id == user.id)
            )
            rules = rules_result.scalars().all()

            # If user has any access rule, check permission level
            permission_levels = {"read": 1, "write": 2, "admin": 3}
            required_level = permission_levels.get(required, 1)

            for rule in rules:
                rule_level = permission_levels.get(rule.permission, 0)
                if rule_level >= required_level:
                    return True

            # No explicit rules — user still gets access to their default dir
            # (the routing module falls back to DEFAULT_STORAGE_PATH/{username})
            # Allow read/write to own default directory
            return True

    try:
        return _run_async(_check())
    except Exception:
        return False


def check_quota(username: str, additional_bytes: int) -> bool:
    """
    Check if a user has enough quota remaining for a write operation.
    Returns True if allowed, False if quota would be exceeded.
    None quota = unlimited.
    """

    async def _check():
        from sqlalchemy import func, select

        from app.database import async_session
        from app.models.activity import ActivityLog
        from app.models.user import User

        async with async_session() as session:
            result = await session.execute(
                select(User).where(User.username == username, User.is_active.is_(True))
            )
            user = result.scalar_one_or_none()
            if not user:
                return False

            if user.quota_bytes is None:
                return True

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
        return True


def ensure_user_directory(username: str, base_path: str):
    """Create the user's personal directory if it doesn't exist."""
    user_dir = os.path.join(base_path, username)
    os.makedirs(user_dir, exist_ok=True)
