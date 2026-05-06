"""Access control schemas."""

from pydantic import BaseModel, Field


class AccessControlCreate(BaseModel):
    user_id: str
    storage_id: str
    permission: str = Field(default="read", pattern=r"^(read|write|admin)$")
    path_prefix: str | None = None


class AccessControlResponse(BaseModel):
    id: str
    user_id: str
    storage_id: str
    permission: str
    path_prefix: str | None

    class Config:
        from_attributes = True


class AccessControlListResponse(BaseModel):
    rules: list[AccessControlResponse]
    total: int
