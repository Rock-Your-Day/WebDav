"""SLA policy management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.settings import SLAPolicy
from app.models.user import User
from app.schemas.sla import (
    SLAPolicyCreate,
    SLAPolicyListResponse,
    SLAPolicyResponse,
    SLAPolicyUpdate,
)

router = APIRouter()


@router.get("/policies", response_model=SLAPolicyListResponse)
async def list_policies(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """List all SLA policies."""
    total = (await db.execute(select(func.count(SLAPolicy.id)))).scalar() or 0
    result = await db.execute(select(SLAPolicy))
    policies = result.scalars().all()

    return SLAPolicyListResponse(
        policies=[SLAPolicyResponse.model_validate(p) for p in policies],
        total=total,
    )


@router.post("/policies", response_model=SLAPolicyResponse, status_code=status.HTTP_201_CREATED)
async def create_policy(
    request: SLAPolicyCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Create a new SLA policy."""
    policy = SLAPolicy(
        name=request.name,
        user_id=request.user_id,
        storage_id=request.storage_id,
        expected_frequency_hours=request.expected_frequency_hours,
        alert_webhook=request.alert_webhook,
        alert_email=request.alert_email,
        is_active=request.is_active,
    )
    db.add(policy)
    await db.flush()
    await db.refresh(policy)

    return SLAPolicyResponse.model_validate(policy)


@router.put("/policies/{policy_id}", response_model=SLAPolicyResponse)
async def update_policy(
    policy_id: str,
    request: SLAPolicyUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Update an SLA policy."""
    result = await db.execute(select(SLAPolicy).where(SLAPolicy.id == policy_id))
    policy = result.scalar_one_or_none()
    if not policy:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Policy not found")

    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(policy, field, value)

    await db.flush()
    await db.refresh(policy)

    return SLAPolicyResponse.model_validate(policy)


@router.delete("/policies/{policy_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_policy(
    policy_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Delete an SLA policy."""
    result = await db.execute(select(SLAPolicy).where(SLAPolicy.id == policy_id))
    policy = result.scalar_one_or_none()
    if not policy:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Policy not found")

    await db.delete(policy)


@router.get("/violations")
async def get_violations(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Get current SLA violations."""
    from app.services.sla import check_sla_compliance

    violations = await check_sla_compliance()
    return {"violations": violations, "total": len(violations)}
