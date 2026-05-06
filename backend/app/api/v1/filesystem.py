"""Filesystem browser endpoint for local storage configuration."""

import os

from fastapi import APIRouter, Depends, HTTPException, Query

from app.dependencies import require_admin
from app.models.user import User

router = APIRouter()

# Allowed base paths that can be browsed (security: prevent browsing entire filesystem)
ALLOWED_ROOTS = ["/data", "/mnt", "/storage", "/backup", "/backups", "/exports"]


def _is_allowed_path(path: str) -> bool:
    """Check if the path is under an allowed root."""
    real_path = os.path.realpath(path)
    return any(real_path.startswith(root) for root in ALLOWED_ROOTS)


@router.get("/browse")
async def browse_filesystem(
    path: str = Query(default="/data", description="Directory path to browse"),
    _admin: User = Depends(require_admin),
):
    """
    Browse the server filesystem to find directories for local storage config.
    Only allows browsing under safe root paths (/data, /mnt, /storage, etc.)
    """
    # Normalize and validate
    path = os.path.realpath(path)

    if not _is_allowed_path(path):
        raise HTTPException(
            status_code=403,
            detail=f"Browsing not allowed outside of: {', '.join(ALLOWED_ROOTS)}",
        )

    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Path does not exist")

    if not os.path.isdir(path):
        raise HTTPException(status_code=400, detail="Path is not a directory")

    # List directory contents
    entries = []
    try:
        for name in sorted(os.listdir(path)):
            full = os.path.join(path, name)
            # Skip hidden files and non-directories
            if name.startswith("."):
                continue
            try:
                is_dir = os.path.isdir(full)
                stat = os.stat(full)
                entries.append({
                    "name": name,
                    "path": full,
                    "is_directory": is_dir,
                    "size": stat.st_size if not is_dir else None,
                    "modified": stat.st_mtime,
                })
            except PermissionError:
                continue
    except PermissionError:
        raise HTTPException(status_code=403, detail="Permission denied")

    return {
        "current_path": path,
        "parent_path": os.path.dirname(path) if _is_allowed_path(os.path.dirname(path)) else None,
        "entries": entries,
    }
