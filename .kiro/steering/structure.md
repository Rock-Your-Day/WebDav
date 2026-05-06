---
inclusion: auto
---

# Project Structure

```
openwebdav/
├── backend/                    # Python FastAPI backend
│   ├── app/
│   │   ├── main.py            # FastAPI app entry point, middleware, lifespan
│   │   ├── config.py          # pydantic-settings configuration (singleton `settings`)
│   │   ├── database.py        # SQLAlchemy async engine, session factory, Base class
│   │   ├── dependencies.py    # FastAPI dependencies (get_current_user, require_admin)
│   │   ├── middleware.py      # Security headers + rate limiting middleware
│   │   ├── api/
│   │   │   └── v1/            # Versioned API routes (auth, users, storage, reports, settings)
│   │   ├── models/            # SQLAlchemy ORM models (one file per domain entity)
│   │   ├── schemas/           # Pydantic request/response schemas with validation
│   │   ├── providers/         # Storage backend implementations (base ABC + local, s3, etc.)
│   │   └── services/          # Business logic layer (auth with JWT + bcrypt)
│   ├── alembic/               # Database migrations
│   │   └── versions/          # Migration scripts
│   ├── tests/                 # pytest test suite (auth, users, storage, security)
│   ├── data/                  # Local data directory (SQLite DB, file storage)
│   ├── requirements.txt       # Production dependencies (pinned versions)
│   ├── requirements-dev.txt   # Dev/test dependencies (pytest, ruff, bandit, pip-audit)
│   └── pyproject.toml         # Python project config (ruff, pytest, mypy settings)
├── frontend/                  # React TypeScript SPA
│   ├── src/
│   │   ├── main.tsx           # App bootstrap (React Query provider)
│   │   ├── App.tsx            # Router and route definitions with ProtectedRoute
│   │   ├── api/               # API client layer (axios + typed endpoints)
│   │   ├── stores/            # Zustand stores (auth with localStorage persistence)
│   │   ├── components/        # Shared/layout components
│   │   │   ├── Layout/        # App shell (sidebar, header, outlet)
│   │   │   └── ProtectedRoute.tsx
│   │   ├── pages/             # Page components (one folder per route)
│   │   │   ├── Dashboard/     # Stats cards + Recharts graphs
│   │   │   ├── Users/         # CRUD table with create dialog
│   │   │   ├── Storage/       # Card grid with create/test/delete
│   │   │   ├── AccessControl/
│   │   │   ├── Reports/       # Activity charts + SLA compliance table
│   │   │   ├── Settings/      # Theme editor with live preview
│   │   │   └── Login/         # Login form + SSO button
│   │   ├── theme/             # MUI v7 theme config and context
│   │   └── test/              # Test setup (vitest + MSW mocks)
│   ├── e2e/                   # Playwright E2E tests
│   ├── public/                # Static assets
│   ├── package.json
│   ├── vite.config.ts         # Vite config with API proxy to backend
│   ├── vitest.config.ts       # Vitest config (jsdom, excludes e2e/)
│   ├── playwright.config.ts   # Playwright config (chromium, baseURL)
│   └── tsconfig.json
├── docker/                    # Docker build files
│   ├── Dockerfile             # Multi-stage (node build → python deps → production)
│   ├── entrypoint.sh          # DB init + uvicorn + nginx startup
│   └── nginx.conf             # Reverse proxy config
├── scripts/
│   └── security-scan.sh       # Local security scanning script
├── .github/workflows/
│   ├── ci.yml                 # Main CI pipeline (lint → security → test → build → E2E → scan)
│   ├── docker.yml             # Publish pipeline (all gates → push to GHCR)
│   └── security.yml           # SARIF uploads for GitHub Security tab
├── docs/                      # MkDocs documentation
├── docker-compose.yml         # Dev compose
└── docker-compose.prod.yml    # Production compose
```

## Key Conventions

- **API versioning**: All backend routes live under `/api/v1/` with domain-specific routers
- **Models**: One file per domain entity in `backend/app/models/`, all exported from `__init__.py`
- **Schemas**: Pydantic models in `backend/app/schemas/` for request validation and response serialization
- **Dependencies**: Auth via `get_current_user` and `require_admin` in `backend/app/dependencies.py`
- **Providers**: Storage backends implement the `StorageProvider` ABC from `providers/base.py`
- **Services**: Business logic separated from route handlers into `services/`
- **Frontend pages**: Each page is a folder under `src/pages/` containing a `*Page.tsx` component
- **API layer**: Typed API functions in `src/api/` using axios with JWT interceptors
- **Auth store**: Zustand store in `src/stores/auth.ts` with localStorage persistence
- **Path alias**: Frontend uses `@/` alias mapped to `src/`
- **State**: Server state via React Query, client state via Zustand
- **Theme**: Centralized in `src/theme/` with context provider wrapping the app
- **Database sessions**: Injected via FastAPI `Depends(get_db)` dependency
- **Config**: Single `settings` instance from `app.config`, driven by env vars
- **Security**: Middleware for headers/rate-limiting, Pydantic for input validation, RBAC for authorization
