"""File version history endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.activity import FileVersion
from app.models.user import User

router = APIRouter()


@router.get("/")
async def list_versions(
    file_path: str = Query(..., description="File path to get versions for"),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """List all versions of a file."""
    result = await db.execute(
        select(FileVersion)
        .where(FileVersion.file_path == file_path)
        .order_by(FileVersion.version.desc())
    )
    versions = result.scalars().all()

    return {
        "file_path": file_path,
        "versions": [
            {
                "id": v.id,
                "version": v.version,
                "size": v.size,
                "checksum": v.checksum,
                "created_by": v.created_by,
                "created_at": v.created_at.isoformat() if v.created_at else None,
            }
            for v in versions
        ],
        "total": len(versions),
    }
