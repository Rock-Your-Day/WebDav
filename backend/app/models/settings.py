"""Application settings models."""

import uuid

from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ThemeSettings(Base):
    """Theme and branding configuration (singleton)."""

    __tablename__ = "theme_settings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    app_name: Mapped[str] = mapped_column(String(100), default="OpenWebDav")
    primary_color: Mapped[str] = mapped_column(String(7), default="#1976d2")
    secondary_color: Mapped[str] = mapped_column(String(7), default="#dc004e")
    logo_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    favicon_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    dark_mode_default: Mapped[bool] = mapped_column(Boolean, default=False)


class SLAPolicy(Base):
    """SLA policy for monitoring backup frequency."""

    __tablename__ = "sla_policies"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(200))
    user_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )
    storage_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("storage_destinations.id", ondelete="CASCADE")
    )
    expected_frequency_hours: Mapped[int] = mapped_column(Integer, default=24)
    alert_webhook: Mapped[str | None] = mapped_column(String(500), nullable=True)
    alert_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
