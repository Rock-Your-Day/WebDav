"""Local filesystem storage provider."""

import os
import shutil
from collections.abc import AsyncIterator
from datetime import datetime
from pathlib import Path

import aiofiles

from app.providers.base import FileInfo, StorageProvider


class LocalStorageProvider(StorageProvider):
    """Storage provider for local filesystem."""

    def __init__(self, base_path: str):
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)

    def _resolve(self, path: str) -> Path:
        """Resolve path safely within base directory."""
        resolved = (self.base_path / path.lstrip("/")).resolve()
        if not str(resolved).startswith(str(self.base_path.resolve())):
            raise PermissionError("Path traversal detected")
        return resolved

    async def read(self, path: str) -> AsyncIterator[bytes]:
        """Read file content."""
        file_path = self._resolve(path)
        async with aiofiles.open(file_path, "rb") as f:
            while chunk := await f.read(8192):
                yield chunk

    async def write(self, path: str, content: AsyncIterator[bytes]) -> int:
        """Write content to file."""
        file_path = self._resolve(path)
        file_path.parent.mkdir(parents=True, exist_ok=True)
        total = 0
        async with aiofiles.open(file_path, "wb") as f:
            async for chunk in content:
                await f.write(chunk)
                total += len(chunk)
        return total

    async def delete(self, path: str) -> None:
        """Delete file or directory."""
        file_path = self._resolve(path)
        if file_path.is_dir():
            shutil.rmtree(file_path)
        else:
            file_path.unlink()

    async def list(self, path: str) -> list[FileInfo]:
        """List directory contents."""
        dir_path = self._resolve(path)
        if not dir_path.is_dir():
            raise FileNotFoundError(f"Directory not found: {path}")
        items = []
        for entry in dir_path.iterdir():
            stat = entry.stat()
            items.append(
                FileInfo(
                    path=str(entry.relative_to(self.base_path)),
                    name=entry.name,
                    size=stat.st_size if entry.is_file() else 0,
                    is_directory=entry.is_dir(),
                    modified_at=datetime.fromtimestamp(stat.st_mtime),
                    created_at=datetime.fromtimestamp(stat.st_ctime),
                )
            )
        return items

    async def mkdir(self, path: str) -> None:
        """Create directory."""
        dir_path = self._resolve(path)
        dir_path.mkdir(parents=True, exist_ok=True)

    async def exists(self, path: str) -> bool:
        """Check if path exists."""
        return self._resolve(path).exists()

    async def stat(self, path: str) -> FileInfo:
        """Get file metadata."""
        file_path = self._resolve(path)
        if not file_path.exists():
            raise FileNotFoundError(f"Not found: {path}")
        stat = file_path.stat()
        return FileInfo(
            path=path,
            name=file_path.name,
            size=stat.st_size if file_path.is_file() else 0,
            is_directory=file_path.is_dir(),
            modified_at=datetime.fromtimestamp(stat.st_mtime),
            created_at=datetime.fromtimestamp(stat.st_ctime),
        )

    async def move(self, src: str, dst: str) -> None:
        """Move/rename."""
        shutil.move(str(self._resolve(src)), str(self._resolve(dst)))

    async def copy(self, src: str, dst: str) -> None:
        """Copy file or directory."""
        src_path = self._resolve(src)
        dst_path = self._resolve(dst)
        if src_path.is_dir():
            shutil.copytree(str(src_path), str(dst_path))
        else:
            shutil.copy2(str(src_path), str(dst_path))

    async def test_connection(self) -> bool:
        """Test if base path is accessible."""
        return self.base_path.exists() and os.access(self.base_path, os.W_OK)
