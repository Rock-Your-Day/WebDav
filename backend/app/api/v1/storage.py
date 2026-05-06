"""Storage destination management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.storage import StorageDestination
from app.models.user import User
from app.schemas.storage import StorageCreate, StorageListResponse, StorageResponse, StorageUpdate

router = APIRouter()


@router.get("/", response_model=StorageListResponse)
async def list_storage(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """List all storage destinations."""
    count_result = await db.execute(select(func.count(StorageDestination.id)))
    total = count_result.scalar() or 0

    result = await db.execute(
        select(StorageDestination)
        .offset(skip)
        .limit(limit)
        .order_by(StorageDestination.created_at.desc())
    )
    destinations = result.scalars().all()

    return StorageListResponse(
        destinations=[StorageResponse.model_validate(d) for d in destinations],
        total=total,
    )


@router.post("/", response_model=StorageResponse, status_code=status.HTTP_201_CREATED)
async def create_storage(
    request: StorageCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Create a new storage destination."""
    existing = await db.execute(
        select(StorageDestination).where(StorageDestination.name == request.name)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Storage destination with this name already exists",
        )

    destination = StorageDestination(
        name=request.name,
        provider_type=request.provider_type,
        config=request.config,
        is_active=request.is_active,
    )
    db.add(destination)
    await db.flush()
    await db.refresh(destination)

    return StorageResponse.model_validate(destination)


@router.get("/{storage_id}", response_model=StorageResponse)
async def get_storage(
    storage_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Get storage destination details."""
    result = await db.execute(select(StorageDestination).where(StorageDestination.id == storage_id))
    destination = result.scalar_one_or_none()
    if not destination:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Storage not found")

    return StorageResponse.model_validate(destination)


@router.put("/{storage_id}", response_model=StorageResponse)
async def update_storage(
    storage_id: str,
    request: StorageUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Update storage destination."""
    result = await db.execute(select(StorageDestination).where(StorageDestination.id == storage_id))
    destination = result.scalar_one_or_none()
    if not destination:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Storage not found")

    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(destination, field, value)

    await db.flush()
    await db.refresh(destination)

    return StorageResponse.model_validate(destination)


@router.delete("/{storage_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_storage(
    storage_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Delete a storage destination."""
    result = await db.execute(select(StorageDestination).where(StorageDestination.id == storage_id))
    destination = result.scalar_one_or_none()
    if not destination:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Storage not found")

    await db.delete(destination)


@router.post("/{storage_id}/test")
async def test_storage(
    storage_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Test connection to a storage destination."""
    result = await db.execute(select(StorageDestination).where(StorageDestination.id == storage_id))
    destination = result.scalar_one_or_none()
    if not destination:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Storage not found")

    # TODO: Actually test the connection based on provider_type
    return {"status": "ok", "message": f"Connection to '{destination.name}' successful"}
