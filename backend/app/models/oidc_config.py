"""OIDC configuration model — persisted in database."""

import uuid

from sqlalchemy import Boolean, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class OIDCConfig(Base):
    """OIDC provider configuration (singleton row)."""

    __tablename__ = "oidc_config"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    provider_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    client_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    client_secret: Mapped[str | None] = mapped_column(String(500), nullable=True)
    scopes: Mapped[str] = mapped_column(String(255), default="openid profile email")
    redirect_uri: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Group-to-role mapping (JSON string: {"admin_groups": [...], "user_groups": [...]})
    role_mapping: Mapped[str | None] = mapped_column(Text, nullable=True)
