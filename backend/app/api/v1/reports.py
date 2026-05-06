"""Reports and analytics endpoints."""

from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.activity import ActivityLog
from app.models.storage import StorageDestination
from app.models.user import User

router = APIRouter()


@router.get("/dashboard")
async def dashboard_stats(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Get dashboard summary statistics."""
    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    active_users = (
        await db.execute(select(func.count(User.id)).where(User.is_active.is_(True)))
    ).scalar() or 0
    total_storage = (await db.execute(select(func.count(StorageDestination.id)))).scalar() or 0

    # Activity in last 24h
    since = datetime.now(UTC) - timedelta(hours=24)
    transfers_today = (
        await db.execute(select(func.count(ActivityLog.id)).where(ActivityLog.timestamp >= since))
    ).scalar() or 0

    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_storage_destinations": total_storage,
        "transfers_today": transfers_today,
    }


@router.get("/activity")
async def activity_report(
    days: int = 7,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Get activity summary report for the last N days."""
    since = datetime.now(UTC) - timedelta(days=days)

    result = await db.execute(
        select(
            func.date(ActivityLog.timestamp).label("date"),
            ActivityLog.action,
            func.count(ActivityLog.id).label("count"),
        )
        .where(ActivityLog.timestamp >= since)
        .group_by(func.date(ActivityLog.timestamp), ActivityLog.action)
        .order_by(func.date(ActivityLog.timestamp))
    )
    rows = result.all()

    # Group by date
    activity: dict[str, dict[str, int]] = {}
    for row in rows:
        date_str = str(row.date)
        if date_str not in activity:
            activity[date_str] = {"date": date_str, "uploads": 0, "downloads": 0, "deletes": 0}
        if row.action == "upload":
            activity[date_str]["uploads"] = row.count
        elif row.action == "download":
            activity[date_str]["downloads"] = row.count
        elif row.action == "delete":
            activity[date_str]["deletes"] = row.count

    return {"activity": list(activity.values()), "period_days": days}


@router.get("/storage-usage")
async def storage_usage_report(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Get storage usage per destination."""
    result = await db.execute(
        select(
            StorageDestination.id,
            StorageDestination.name,
            StorageDestination.provider_type,
            func.coalesce(func.sum(ActivityLog.file_size), 0).label("total_bytes"),
        )
        .outerjoin(ActivityLog, ActivityLog.storage_id == StorageDestination.id)
        .group_by(StorageDestination.id)
    )
    rows = result.all()

    return {
        "usage": [
            {
                "id": row.id,
                "name": row.name,
                "provider_type": row.provider_type,
                "total_bytes": row.total_bytes,
            }
            for row in rows
        ]
    }


@router.get("/sla-compliance")
async def sla_compliance_report(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Get SLA compliance report — users with no recent activity."""
    # Find users whose last activity is older than 24h (configurable via SLA policies)
    cutoff = datetime.now(UTC) - timedelta(hours=24)

    result = await db.execute(
        select(
            User.id,
            User.username,
            func.max(ActivityLog.timestamp).label("last_activity"),
        )
        .outerjoin(ActivityLog, ActivityLog.user_id == User.id)
        .where(User.is_active.is_(True))
        .group_by(User.id)
    )
    rows = result.all()

    violations = []
    compliant = []
    for row in rows:
        entry = {
            "user_id": row.id,
            "username": row.username,
            "last_activity": row.last_activity.isoformat() if row.last_activity else None,
        }
        if row.last_activity is None or row.last_activity < cutoff:
            violations.append(entry)
        else:
            compliant.append(entry)

    return {
        "violations": violations,
        "compliant": compliant,
        "total_violations": len(violations),
        "total_compliant": len(compliant),
    }
