"""Storage destination file browser endpoint."""

import os

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.storage import StorageDestination
from app.models.user import User

router = APIRouter()


@router.get("/{storage_id}/browse")
async def browse_storage(
    storage_id: str,
    path: str = Query(default="", description="Relative path within the storage"),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Browse files and folders within a storage destination."""
    result = await db.execute(select(StorageDestination).where(StorageDestination.id == storage_id))
    storage = result.scalar_one_or_none()
    if not storage:
        raise HTTPException(status_code=404, detail="Storage destination not found")

    if storage.provider_type != "local":
        raise HTTPException(
            status_code=400,
            detail="Browsing is only supported for local filesystem storage",
        )

    base_path = storage.config.get("path", "/data/storage")
    full_path = os.path.realpath(os.path.join(base_path, path.lstrip("/")))

    # Prevent path traversal
    if not full_path.startswith(os.path.realpath(base_path)):
        raise HTTPException(status_code=403, detail="Path traversal not allowed")

    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="Path does not exist")

    if not os.path.isdir(full_path):
        raise HTTPException(status_code=400, detail="Path is not a directory")

    entries = []
    try:
        for name in sorted(os.listdir(full_path)):
            if name.startswith("."):
                continue
            entry_path = os.path.join(full_path, name)
            try:
                stat = os.stat(entry_path)
                is_dir = os.path.isdir(entry_path)
                entries.append(
                    {
                        "name": name,
                        "path": os.path.join(path, name).lstrip("/"),
                        "is_directory": is_dir,
                        "size": stat.st_size if not is_dir else None,
                        "modified": stat.st_mtime,
                        "children_count": len(os.listdir(entry_path)) if is_dir else None,
                    }
                )
            except (PermissionError, OSError):
                continue
    except PermissionError:
        raise HTTPException(status_code=403, detail="Permission denied")

    # Calculate stats
    total_files = sum(1 for e in entries if not e["is_directory"])
    total_dirs = sum(1 for e in entries if e["is_directory"])
    total_size: int = 0
    for e in entries:
        if not e["is_directory"] and e["size"] is not None:
            total_size += e["size"]  # type: ignore[operator]

    return {
        "storage_id": storage_id,
        "storage_name": storage.name,
        "base_path": base_path,
        "current_path": path or "/",
        "parent_path": os.path.dirname(path) if path else None,
        "entries": entries,
        "stats": {
            "total_files": total_files,
            "total_dirs": total_dirs,
            "total_size": total_size,
        },
    }
