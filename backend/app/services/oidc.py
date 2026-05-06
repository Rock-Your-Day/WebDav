"""OIDC authentication service."""

from authlib.integrations.starlette_client import OAuth

from app.config import settings

oauth = OAuth()


def configure_oidc():
    """Configure the OIDC provider if enabled."""
    if not settings.oidc_enabled:
        return

    oauth.register(
        name="oidc",
        client_id=settings.oidc_client_id,
        client_secret=settings.oidc_client_secret,
        server_metadata_url=f"{settings.oidc_provider_url}/.well-known/openid-configuration",
        client_kwargs={"scope": settings.oidc_scopes},
    )


def get_oauth():
    """Get the configured OAuth instance."""
    return oauth
