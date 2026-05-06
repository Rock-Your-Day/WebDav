# Configuration

OpenWebDav is configured via environment variables. All settings have sensible defaults.

## Environment Variables

### Core

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | (required) | Secret key for JWT signing |
| `DATABASE_URL` | `sqlite+aiosqlite:///./data/openwebdav.db` | Database connection URL |
| `APP_NAME` | `OpenWebDav` | Application display name |
| `APP_URL` | `http://localhost:8080` | Public URL of the application |
| `LOG_LEVEL` | `info` | Logging level |

### Authentication

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_EXPIRY_MINUTES` | `60` | JWT token expiry time |
| `JWT_REFRESH_EXPIRY_DAYS` | `7` | Refresh token expiry |
| `ADMIN_USERNAME` | `admin` | Initial admin username |
| `ADMIN_PASSWORD` | `admin` | Initial admin password |

### OIDC

| Variable | Default | Description |
|----------|---------|-------------|
| `OIDC_ENABLED` | `false` | Enable OIDC authentication |
| `OIDC_PROVIDER_URL` | - | OIDC provider discovery URL |
| `OIDC_CLIENT_ID` | - | OAuth2 client ID |
| `OIDC_CLIENT_SECRET` | - | OAuth2 client secret |
| `OIDC_SCOPES` | `openid profile email` | Requested scopes |

### Storage

| Variable | Default | Description |
|----------|---------|-------------|
| `DEFAULT_STORAGE_PATH` | `/data/storage` | Default local storage path |

### SLA Monitoring

| Variable | Default | Description |
|----------|---------|-------------|
| `SLA_CHECK_INTERVAL_MINUTES` | `15` | How often to check SLA compliance |
| `SLA_ALERT_WEBHOOK_URL` | - | Webhook for SLA violation alerts |
| `SLA_ALERT_EMAIL_FROM` | `noreply@openwebdav.local` | From address for email alerts |

## Database

### SQLite (Default)

Zero configuration. Data stored in `/data/openwebdav.db`.

### PostgreSQL

Set `DATABASE_URL` to a PostgreSQL connection string:

```
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/openwebdav
```
