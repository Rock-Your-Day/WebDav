"""Authentication endpoints."""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import LoginRequest, RefreshRequest, TokenResponse
from app.services.auth import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_password,
)

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user with username/password and return JWT."""
    result = await db.execute(select(User).where(User.username == request.username))
    user = result.scalar_one_or_none()

    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    if not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled",
        )

    # Update last login
    user.last_login = datetime.now(UTC)
    await db.commit()

    # Generate tokens
    token_data = {"sub": user.id, "username": user.username, "role": user.role}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.jwt_expiry_minutes * 60,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Refresh an expired JWT token."""
    payload = decode_token(request.refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    token_data = {"sub": user.id, "username": user.username, "role": user.role}
    access_token = create_access_token(token_data)
    new_refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        expires_in=settings.jwt_expiry_minutes * 60,
    )


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user info."""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "auth_provider": current_user.auth_provider,
    }


@router.post("/logout")
async def logout():
    """Logout (client should discard tokens)."""
    return {"message": "Logged out successfully"}


@router.get("/oidc/login")
async def oidc_login(request: Request):
    """Initiate OIDC authentication flow."""
    if not settings.oidc_enabled:
        raise HTTPException(status_code=400, detail="OIDC is not enabled")

    from app.services.oidc import get_oauth

    oauth = get_oauth()
    redirect_uri = settings.oidc_redirect_uri or str(request.url_for("oidc_callback"))
    return await oauth.oidc.authorize_redirect(request, redirect_uri)


async def _resolve_oidc_role(db: AsyncSession, userinfo: dict) -> str:
    """Resolve user role from OIDC groups/claims using the configured mapping."""
    import json

    from app.models.oidc_config import OIDCConfig

    result = await db.execute(select(OIDCConfig).limit(1))
    config = result.scalar_one_or_none()

    if not config or not config.role_mapping:
        return "user"

    try:
        mapping = json.loads(config.role_mapping)
    except json.JSONDecodeError:
        return "user"

    # Extract groups from userinfo (common claims: groups, roles, realm_access.roles)
    user_groups: list[str] = []
    if "groups" in userinfo:
        user_groups = userinfo["groups"]
    elif "roles" in userinfo:
        user_groups = userinfo["roles"]
    elif "realm_access" in userinfo and "roles" in userinfo["realm_access"]:
        user_groups = userinfo["realm_access"]["roles"]

    # Check admin groups first (highest priority)
    admin_groups = mapping.get("admin_groups", [])
    if any(g in user_groups for g in admin_groups):
        return "admin"

    # Check readonly groups
    readonly_groups = mapping.get("readonly_groups", [])
    if any(g in user_groups for g in readonly_groups):
        return "readonly"

    # Check user groups
    user_groups_config = mapping.get("user_groups", [])
    if user_groups_config and any(g in user_groups for g in user_groups_config):
        return "user"

    return mapping.get("default_role", "user")


@router.get("/oidc/callback")
async def oidc_callback(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle OIDC provider callback — create/update user and issue JWT."""
    if not settings.oidc_enabled:
        raise HTTPException(status_code=400, detail="OIDC is not enabled")

    from app.services.oidc import get_oauth

    oauth = get_oauth()

    try:
        token = await oauth.oidc.authorize_access_token(request)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"OIDC authentication failed: {e}")

    userinfo = token.get("userinfo")
    if not userinfo:
        raise HTTPException(status_code=401, detail="No user info from OIDC provider")

    sub = userinfo.get("sub")
    email = userinfo.get("email", f"{sub}@oidc")
    username = userinfo.get("preferred_username") or userinfo.get("name") or sub

    # Find or create user
    result = await db.execute(select(User).where(User.oidc_subject == sub))
    user = result.scalar_one_or_none()

    # Determine role from OIDC groups
    role = await _resolve_oidc_role(db, userinfo)

    if not user:
        # Check if username already taken
        existing = await db.execute(select(User).where(User.username == username))
        if existing.scalar_one_or_none():
            username = f"{username}_{sub[:8]}"

        user = User(
            username=username,
            email=email,
            auth_provider="oidc",
            oidc_subject=sub,
            role=role,
            is_active=True,
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)
    else:
        # Update role on each login based on current group membership
        user.role = role

    # Update last login
    user.last_login = datetime.now(UTC)
    await db.commit()

    # Generate JWT
    token_data = {"sub": user.id, "username": user.username, "role": user.role}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    # Redirect to frontend with tokens as query params
    # The frontend will extract these and store them
    redirect_url = (
        f"{settings.app_url}/login"
        f"?access_token={access_token}"
        f"&refresh_token={refresh_token}"
    )
    return RedirectResponse(url=redirect_url)
