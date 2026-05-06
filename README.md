# OpenWebDav

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://img.shields.io/badge/CI-GitHub%20Actions-green.svg)](https://github.com)

**A modern, open-source WebDAV server with a beautiful admin portal.**

OpenWebDav provides a self-hosted WebDAV server with configurable storage backends, user management, OIDC authentication, SLA monitoring, and a fully customizable Material UI v7 admin dashboard — all in a single Docker image.

---

## Features

- **WebDAV Server** — RFC-compliant WebDAV with support for all major clients
- **Multiple Storage Backends** — Local filesystem, AWS S3, NFS mounts, Azure Blob
- **User Management** — Local users with role-based access control (admin, user, readonly)
- **OIDC/SSO Integration** — Connect to any OpenID Connect provider (Keycloak, Okta, Azure AD)
- **SLA Monitoring** — Track backup frequency, alert on missed SLAs
- **Reports & Analytics** — Visual dashboards with storage usage, activity trends, compliance
- **File Versioning** — Keep history of file changes
- **Storage Quotas** — Optional per-user storage limits
- **Customizable Theme** — Change colors, logo, and branding via the admin UI
- **Single Docker Image** — Easy deployment, minimal configuration
- **Dark Mode** — Built-in light/dark theme support
- **Security First** — JWT auth, rate limiting, security headers, input validation, RBAC

---

## Quick Start

```bash
docker run -d \
  --name openwebdav \
  -p 8080:80 \
  -v openwebdav_data:/data \
  -e SECRET_KEY=change-me-in-production \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=changeme \
  ghcr.io/your-org/openwebdav:latest
```

Then open `http://localhost:8080` and log in with your admin credentials.

---

## Configuration

Configuration is done via environment variables or a `.env` file:

```env
# Database (SQLite default, PostgreSQL for production)
DATABASE_URL=sqlite+aiosqlite:///./data/openwebdav.db

# Security
SECRET_KEY=your-secret-key-here

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme

# OIDC (optional)
OIDC_ENABLED=false
OIDC_PROVIDER_URL=https://your-idp.com/realms/your-realm
OIDC_CLIENT_ID=openwebdav
OIDC_CLIENT_SECRET=your-client-secret

# Default storage path
DEFAULT_STORAGE_PATH=/data/storage
```

See the [full configuration guide](docs/docs/configuration.md) for all options.

---

## Architecture

```
┌─────────────────────────────────────┐
│         Docker Container            │
│                                     │
│  Nginx (reverse proxy, port 80)     │
│    ├── / → React SPA (MUI v7)      │
│    ├── /api/* → FastAPI             │
│    └── /dav/* → WebDAV (WsgiDAV)   │
│                                     │
│  Storage Providers:                 │
│    • Local Filesystem               │
│    • AWS S3 / S3-Compatible         │
│    • NFS Mounts                     │
│    • Azure Blob Storage             │
│                                     │
│  Database:                          │
│    • SQLite (default)               │
│    • PostgreSQL (production)        │
└─────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11, FastAPI, SQLAlchemy 2.0 (async), Alembic |
| Frontend | React 18, TypeScript, Material UI v7, Recharts, Vite 5 |
| Auth | JWT (python-jose), bcrypt, Authlib (OIDC) |
| State | Zustand (client), TanStack React Query v5 (server) |
| WebDAV | WsgiDAV + a2wsgi bridge |
| Container | Docker (Nginx + uvicorn) |
| CI/CD | GitHub Actions |

---

## Development

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker (for containerized development)

### Setup

```bash
# Clone
git clone https://github.com/your-org/openwebdav.git
cd openwebdav

# Backend
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

### Docker Development

```bash
docker compose up --build
```

### Running Tests

```bash
# Backend (63 tests)
cd backend && pytest -v

# Frontend unit tests (36 tests)
cd frontend && npm run test

# E2E tests (27 tests) — requires running container on :8080
cd frontend && npm run test:e2e
```

### Security Scanning

```bash
# Run all local security checks
./scripts/security-scan.sh

# Individual tools
bandit -r backend/app/ --severity-level medium
pip-audit -r backend/requirements.txt
cd frontend && npm audit --audit-level=critical
```

---

## CI/CD Pipeline

All checks must pass before a container artifact is published:

1. **Lint** — ruff, mypy, eslint, tsc
2. **Security** — Bandit SAST, pip-audit, npm audit, Gitleaks secret scan
3. **Unit Tests** — pytest (63 tests), vitest (36 tests)
4. **Docker Build** — Multi-stage image build
5. **E2E Tests** — Playwright (27 tests) against running container
6. **Container Scan** — Trivy (CRITICAL/HIGH vulnerabilities)
7. **Publish** — Push to GHCR (only on version tags, only if all above pass)

---

## WebDAV Client Configuration

OpenWebDav acts as a storage proxy. Connect any WebDAV client to:

```
http://your-server:8080/dav/
```

**Setup:**
1. Create a storage destination in the admin UI (Storage page)
2. Assign it to your user (Users → Edit → Storage Destination)
3. Connect your client with Basic Auth (username + password)

Files automatically go to the storage path assigned to your user. Each user has one storage destination (1:1 mapping).

### Tested Clients

- macOS Finder (Connect to Server)
- Notability / GoodNotes (WebDAV backup)
- Cyberduck / WinSCP
- rclone / Duplicati
- Windows Explorer (Map Network Drive)

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

MIT — see [LICENSE](LICENSE) for details.
