"""Storage destination model."""

import uuid
from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Enum, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class StorageDestination(Base):
    """Storage destination configuration."""

    __tablename__ = "storage_destinations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(200), unique=True)
    provider_type: Mapped[str] = mapped_column(
        Enum("local", "s3", "nfs", "azure", name="provider_type_enum")
    )
    config: Mapped[dict] = mapped_column(JSON, default=dict)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
