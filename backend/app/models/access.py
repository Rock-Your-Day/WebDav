"""Access control model."""

import uuid

from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AccessControl(Base):
    """User access control for storage destinations."""

    __tablename__ = "access_controls"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"))
    storage_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("storage_destinations.id", ondelete="CASCADE")
    )
    permission: Mapped[str] = mapped_column(
        Enum("read", "write", "admin", name="permission_enum"), default="read"
    )
    path_prefix: Mapped[str | None] = mapped_column(String(500), nullable=True)
