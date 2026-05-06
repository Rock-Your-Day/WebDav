"""Storage schemas."""

from datetime import datetime

from pydantic import BaseModel, Field


class StorageCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    provider_type: str = Field(..., pattern=r"^(local|s3|nfs|azure)$")
    config: dict = Field(default_factory=dict)
    is_active: bool = True


class StorageUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=200)
    config: dict | None = None
    is_active: bool | None = None


class StorageResponse(BaseModel):
    id: str
    name: str
    provider_type: str
    config: dict
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class StorageListResponse(BaseModel):
    destinations: list[StorageResponse]
    total: int
