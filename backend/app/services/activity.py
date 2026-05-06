"""Activity logging service for tracking file operations."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity import ActivityLog


async def log_activity(
    db: AsyncSession,
    user_id: str | None,
    storage_id: str | None,
    action: str,
    file_path: str,
    file_size: int | None = None,
) -> ActivityLog:
    """Record a file operation in the activity log."""
    entry = ActivityLog(
        user_id=user_id,
        storage_id=storage_id,
        action=action,
        file_path=file_path,
        file_size=file_size,
    )
    db.add(entry)
    await db.flush()
    return entry
