"""Activity log and file version models."""

import uuid
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ActivityLog(Base):
    """File transfer activity log."""

    __tablename__ = "activity_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    storage_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("storage_destinations.id", ondelete="SET NULL"), nullable=True
    )
    action: Mapped[str] = mapped_column(
        Enum("upload", "download", "delete", "mkdir", "move", "copy", name="action_enum")
    )
    file_path: Mapped[str] = mapped_column(String(1000))
    file_size: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)


class FileVersion(Base):
    """File version tracking."""

    __tablename__ = "file_versions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    storage_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("storage_destinations.id", ondelete="CASCADE")
    )
    file_path: Mapped[str] = mapped_column(String(1000), index=True)
    version: Mapped[int] = mapped_column(Integer)
    size: Mapped[int] = mapped_column(BigInteger)
    checksum: Mapped[str] = mapped_column(String(64))
    created_by: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
