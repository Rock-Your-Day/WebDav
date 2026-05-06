"""Abstract base class for storage providers."""

from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from dataclasses import dataclass
from datetime import datetime


@dataclass
class FileInfo:
    """File metadata."""

    path: str
    name: str
    size: int
    is_directory: bool
    modified_at: datetime
    created_at: datetime | None = None
    content_type: str | None = None
    checksum: str | None = None


class StorageProvider(ABC):
    """Abstract storage provider interface."""

    @abstractmethod
    async def read(self, path: str) -> AsyncIterator[bytes]:
        """Read file content as async byte stream."""
        ...

    @abstractmethod
    async def write(self, path: str, content: AsyncIterator[bytes]) -> int:
        """Write content to file. Returns bytes written."""
        ...

    @abstractmethod
    async def delete(self, path: str) -> None:
        """Delete a file or empty directory."""
        ...

    @abstractmethod
    async def list(self, path: str) -> list[FileInfo]:
        """List directory contents."""
        ...

    @abstractmethod
    async def mkdir(self, path: str) -> None:
        """Create a directory."""
        ...

    @abstractmethod
    async def exists(self, path: str) -> bool:
        """Check if path exists."""
        ...

    @abstractmethod
    async def stat(self, path: str) -> FileInfo:
        """Get file/directory metadata."""
        ...

    @abstractmethod
    async def move(self, src: str, dst: str) -> None:
        """Move/rename a file or directory."""
        ...

    @abstractmethod
    async def copy(self, src: str, dst: str) -> None:
        """Copy a file or directory."""
        ...

    @abstractmethod
    async def test_connection(self) -> bool:
        """Test if the storage backend is accessible."""
        ...
