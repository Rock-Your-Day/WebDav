"""SMTP configuration model."""

import uuid

from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class SMTPConfig(Base):
    """SMTP email configuration (singleton row)."""

    __tablename__ = "smtp_config"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    host: Mapped[str | None] = mapped_column(String(255), nullable=True)
    port: Mapped[int] = mapped_column(Integer, default=587)
    username: Mapped[str | None] = mapped_column(String(255), nullable=True)
    password: Mapped[str | None] = mapped_column(String(500), nullable=True)
    use_tls: Mapped[bool] = mapped_column(Boolean, default=True)
    from_email: Mapped[str] = mapped_column(String(255), default="noreply@openwebdav.local")
