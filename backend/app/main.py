"""OpenWebDav - Main FastAPI Application."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import router as api_v1_router
from app.config import settings
from app.middleware import RateLimitMiddleware, SecurityHeadersMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown."""
    # Startup
    print(f"[OpenWebDav] Starting {settings.app_name}...")
    print(f"[OpenWebDav] Database: {settings.database_url}")
    print(f"[OpenWebDav] OIDC Enabled: {settings.oidc_enabled}")
    print(f"[OpenWebDav] WebDAV storage: {settings.default_storage_path}")

    # Configure OIDC if enabled
    if settings.oidc_enabled:
        from app.services.oidc import configure_oidc
        configure_oidc()
        print("[OpenWebDav] OIDC configured")

    # Start background scheduler
    from app.tasks.scheduler import start_scheduler
    start_scheduler()

    yield

    # Shutdown
    from app.tasks.scheduler import stop_scheduler
    stop_scheduler()
    print("[OpenWebDav] Shutting down...")


app = FastAPI(
    title=settings.app_name,
    description="Open-source WebDAV server with admin portal",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# Security middleware (order matters — outermost first)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware, max_requests=20, window_seconds=60)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.app_url, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_v1_router, prefix="/api/v1")


@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": "0.1.0",
    }


# Mount WebDAV at /dav
from app.webdav.app import create_webdav_app  # noqa: E402

app.mount("/dav", create_webdav_app())
