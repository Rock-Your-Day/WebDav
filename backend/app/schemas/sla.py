"""SLA policy schemas."""

from pydantic import BaseModel, Field


class SLAPolicyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    user_id: str | None = None
    storage_id: str
    expected_frequency_hours: int = Field(default=24, ge=1, le=8760)
    alert_webhook: str | None = Field(default=None, max_length=500)
    alert_email: str | None = Field(default=None, max_length=255)
    is_active: bool = True


class SLAPolicyUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=200)
    expected_frequency_hours: int | None = Field(default=None, ge=1, le=8760)
    alert_webhook: str | None = None
    alert_email: str | None = None
    is_active: bool | None = None


class SLAPolicyResponse(BaseModel):
    id: str
    name: str
    user_id: str | None
    storage_id: str
    expected_frequency_hours: int
    alert_webhook: str | None
    alert_email: str | None
    is_active: bool

    class Config:
        from_attributes = True


class SLAPolicyListResponse(BaseModel):
    policies: list[SLAPolicyResponse]
    total: int
