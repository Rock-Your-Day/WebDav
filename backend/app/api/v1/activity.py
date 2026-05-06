"""Activity log viewer endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.activity import ActivityLog
from app.models.user import User

router = APIRouter()


@router.get("/")
async def list_activity(
    skip: int = 0,
    limit: int = 100,
    user_id: str | None = Query(default=None),
    action: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """List activity log entries with optional filters."""
    query = select(ActivityLog)
    count_query = select(func.count(ActivityLog.id))

    if user_id:
        query = query.where(ActivityLog.user_id == user_id)
        count_query = count_query.where(ActivityLog.user_id == user_id)
    if action:
        query = query.where(ActivityLog.action == action)
        count_query = count_query.where(ActivityLog.action == action)

    total = (await db.execute(count_query)).scalar() or 0

    result = await db.execute(
        query.order_by(ActivityLog.timestamp.desc()).offset(skip).limit(limit)
    )
    entries = result.scalars().all()

    return {
        "entries": [
            {
                "id": e.id,
                "user_id": e.user_id,
                "storage_id": e.storage_id,
                "action": e.action,
                "file_path": e.file_path,
                "file_size": e.file_size,
                "timestamp": e.timestamp.isoformat() if e.timestamp else None,
            }
            for e in entries
        ],
        "total": total,
    }
