"""User schemas."""

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=100, pattern=r"^[a-zA-Z0-9_.-]+$")
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    role: str = Field(default="user", pattern=r"^(admin|user|readonly)$")
    quota_bytes: int | None = None


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    role: str | None = Field(default=None, pattern=r"^(admin|user|readonly)$")
    is_active: bool | None = None
    quota_bytes: int | None = None


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    role: str
    is_active: bool
    auth_provider: str
    quota_bytes: int | None
    created_at: datetime
    last_login: datetime | None

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    users: list[UserResponse]
    total: int
