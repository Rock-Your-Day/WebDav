"""Application configuration using pydantic-settings."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    app_name: str = "OpenWebDav"
    app_url: str = "http://localhost:8080"
    log_level: str = "info"
    debug: bool = False

    # Database
    database_url: str = "sqlite+aiosqlite:////data/db/openwebdav.db"

    # Security
    secret_key: str = "change-this-to-a-random-string-in-production"
    jwt_expiry_minutes: int = 60
    jwt_refresh_expiry_days: int = 7
    jwt_algorithm: str = "HS256"

    # OIDC
    oidc_enabled: bool = False
    oidc_provider_url: str | None = None
    oidc_client_id: str | None = None
    oidc_client_secret: str | None = None
    oidc_scopes: str = "openid profile email"
    oidc_redirect_uri: str | None = None

    # Storage
    default_storage_path: str = "/data/storage"

    # SLA
    sla_check_interval_minutes: int = 15
    sla_alert_webhook_url: str | None = None
    sla_alert_email_from: str = "noreply@openwebdav.local"

    # SMTP
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_user: str | None = None
    smtp_password: str | None = None
    smtp_use_tls: bool = True

    # Admin
    admin_username: str = "admin"
    admin_password: str = "admin"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


settings = Settings()
