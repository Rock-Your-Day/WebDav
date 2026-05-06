---
inclusion: auto
---

# Tech Stack

## Backend (Python 3.11+)

- **Framework**: FastAPI 0.136+ with async/await throughout
- **Database ORM**: SQLAlchemy 2.0 (async mode) with `mapped_column` style
- **Migrations**: Alembic (async-compatible)
- **Auth**: python-jose (JWT), passlib/bcrypt (pinned to 4.1.3), authlib (OIDC)
- **WebDAV**: WsgiDAV + a2wsgi bridge
- **Storage SDKs**: boto3 (S3), azure-storage-blob, fsspec/s3fs
- **Config**: pydantic-settings (env-based)
- **Scheduler**: APScheduler
- **HTTP client**: httpx (async)
- **Security middleware**: Custom rate limiting + security headers

## Frontend (Node.js 18+)

- **Framework**: React 18 with TypeScript (strict mode)
- **Build tool**: Vite 5
- **UI library**: Material UI (MUI) v7 with Emotion
- **Routing**: react-router-dom v6
- **State management**: Zustand (client state), TanStack React Query v5 (server state)
- **Charts**: Recharts
- **HTTP client**: Axios (with JWT interceptors)
- **Testing**: Vitest + Testing Library + MSW (unit), Playwright (E2E)

## Infrastructure

- **Container**: Single Docker image (Nginx + FastAPI + React SPA)
- **Reverse proxy**: Nginx
- **CI/CD**: GitHub Actions (lint → security → test → build → E2E → scan → publish)
- **Database**: SQLite (dev) / PostgreSQL (prod)

## Security Tools

- **SAST**: Bandit (Python), Semgrep (multi-language)
- **SCA**: pip-audit (Python deps), npm audit (Node deps)
- **Secrets**: Gitleaks
- **Container**: Trivy
- **Dockerfile**: Hadolint
- **Runtime**: Rate limiting, security headers, RBAC, input validation

## Linting & Formatting

- **Backend**: Ruff (line-length 100, rules: E, F, I, N, W, UP), mypy
- **Frontend**: ESLint v8 with TypeScript and React plugins

## Common Commands

### Backend

```bash
cd backend
source venv/bin/activate

# Run dev server
uvicorn app.main:app --reload

# Run tests
pytest

# Run tests with coverage
pytest --cov=app

# Lint
ruff check .

# Format
ruff format .

# Type check
mypy app --ignore-missing-imports

# Security scan
bandit -r app/ --severity-level medium
pip-audit -r requirements.txt
```

### Frontend

```bash
cd frontend

# Run dev server
npm run dev

# Build for production
npm run build

# Lint
npm run lint

# Type check
npm run typecheck

# Unit tests
npm run test

# E2E tests (requires container on :8080)
npm run test:e2e

# E2E with browser visible
npm run test:e2e:headed
```

### Docker

```bash
# Development
docker compose up --build

# Production
docker compose -f docker-compose.prod.yml up -d

# Security scan
./scripts/security-scan.sh
```
