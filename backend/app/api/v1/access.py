"""Access control endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.access import AccessControl
from app.models.user import User
from app.schemas.access import AccessControlCreate, AccessControlListResponse, AccessControlResponse

router = APIRouter()


@router.get("/", response_model=AccessControlListResponse)
async def list_access_rules(
    user_id: str | None = None,
    storage_id: str | None = None,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """List access control rules, optionally filtered by user or storage."""
    query = select(AccessControl)
    count_query = select(func.count(AccessControl.id))

    if user_id:
        query = query.where(AccessControl.user_id == user_id)
        count_query = count_query.where(AccessControl.user_id == user_id)
    if storage_id:
        query = query.where(AccessControl.storage_id == storage_id)
        count_query = count_query.where(AccessControl.storage_id == storage_id)

    total = (await db.execute(count_query)).scalar() or 0
    result = await db.execute(query)
    rules = result.scalars().all()

    return AccessControlListResponse(
        rules=[AccessControlResponse.model_validate(r) for r in rules],
        total=total,
    )


@router.post("/", response_model=AccessControlResponse, status_code=status.HTTP_201_CREATED)
async def create_access_rule(
    request: AccessControlCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Grant a user access to a storage destination."""
    # Check for existing rule
    existing = await db.execute(
        select(AccessControl).where(
            AccessControl.user_id == request.user_id,
            AccessControl.storage_id == request.storage_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Access rule already exists for this user/storage combination",
        )

    rule = AccessControl(
        user_id=request.user_id,
        storage_id=request.storage_id,
        permission=request.permission,
        path_prefix=request.path_prefix,
    )
    db.add(rule)
    await db.flush()
    await db.refresh(rule)

    return AccessControlResponse.model_validate(rule)


@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_access_rule(
    rule_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Revoke an access rule."""
    result = await db.execute(select(AccessControl).where(AccessControl.id == rule_id))
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Access rule not found")

    await db.delete(rule)
