"""WebDAV activity tracking middleware.

Bridges the synchronous WsgiDAV world with our async activity logging service.
"""

import asyncio
import threading

_local = threading.local()


def _run_async(coro):
    """Run an async coroutine from a synchronous WsgiDAV context."""
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


def record_activity(
    environ: dict,
    action: str,
    file_path: str,
    file_size: int | None = None,
):
    """
    Record a file operation in the activity log.

    Called from the synchronous WsgiDAV provider context.
    Extracts the authenticated username from the WSGI environ.
    """
    username = environ.get("wsgidav.auth.user_name", "")

    async def _log():
        from sqlalchemy import select

        from app.database import async_session
        from app.models.activity import ActivityLog
        from app.models.user import User

        async with async_session() as session:
            # Look up user ID from username
            user_id = None
            if username:
                result = await session.execute(
                    select(User.id).where(User.username == username)
                )
                row = result.scalar_one_or_none()
                if row:
                    user_id = row

            entry = ActivityLog(
                user_id=user_id,
                storage_id=None,  # Could be resolved from path in future
                action=action,
                file_path=file_path,
                file_size=file_size,
            )
            session.add(entry)
            await session.commit()

    try:
        _run_async(_log())
    except Exception:
        # Don't let logging failures break WebDAV operations
        pass
