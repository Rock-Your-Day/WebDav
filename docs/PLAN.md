# OpenWebDav - Project Plan

## Overview

**OpenWebDav** is an open-source, self-hosted WebDAV server with a modern admin portal. It provides configurable storage backends (local filesystem, S3, NFS), user management with local and OIDC authentication, SLA reporting, file versioning, and a fully customizable UI theme.

**License:** MIT  
**Deployment:** Single Docker image (all-in-one)  
**Repository:** GitHub with CI/CD via GitHub Actions

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Container                          │
│                                                              │
│  ┌──────────────────────┐    ┌───────────────────────────┐  │
│  │   React Frontend     │    │   FastAPI Backend          │  │
│  │   (Material UI 7)    │    │                           │  │
│  │                      │    │  ┌─────────────────────┐  │  │
│  │  - Admin Dashboard   │◄──►│  │  REST API           │  │  │
│  │  - User Management   │    │  │  /api/v1/*          │  │  │
│  │  - Reports/Graphs    │    │  └─────────────────────┘  │  │
│  │  - Storage Config    │    │                           │  │
│  │  - Theme Settings    │    │  ┌─────────────────────┐  │  │
│  └──────────────────────┘    │  │  WebDAV Endpoint    │  │  │
│                              │  │  /dav/*             │  │  │
│                              │  └─────────────────────┘  │  │
│                              │                           │  │
│                              │  ┌─────────────────────┐  │  │
│                              │  │  Auth Layer         │  │  │
│                              │  │  - Local Users      │  │  │
│                              │  │  - OIDC/OAuth2      │  │  │
│                              │  │  - Basic Auth (DAV) │  │  │
│                              │  └─────────────────────┘  │  │
│                              └───────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Database (SQLite default / PostgreSQL optional)      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Storage Providers                                    │   │
│  │  - Local Filesystem                                   │   │
│  │  - AWS S3 / S3-Compatible (MinIO, etc.)              │   │
│  │  - NFS Mounts                                         │   │
│  │  - Azure Blob Storage                                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Backend
| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Framework | FastAPI (Python 3.11+) | Async, high-performance, auto-generated OpenAPI docs |
| WebDAV | WsgiDAV (integrated via ASGI adapter) | Mature, extensible Python WebDAV implementation |
| Database ORM | SQLAlchemy 2.0 + Alembic | Async support, migration management |
| Auth | python-jose (JWT), authlib (OIDC) | Industry-standard token handling |
| Task Queue | APScheduler | SLA monitoring, scheduled reports |
| Storage | boto3 (S3), fsspec (abstraction) | Unified storage interface |

### Frontend
| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Framework | React 18 + TypeScript | Type safety, ecosystem maturity |
| UI Library | Material UI (MUI) v6 | Rich component library, theming support |
| Charts | Recharts | React-native, composable, lightweight |
| State | TanStack Query + Zustand | Server state + client state separation |
| Build | Vite | Fast builds, HMR |
| Router | React Router v6 | Standard routing |

### Infrastructure
| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Container | Docker (multi-stage build) | Single image deployment |
| Reverse Proxy | Nginx (in-container) | Serves frontend, proxies API/WebDAV |
| CI/CD | GitHub Actions | Automated testing, Docker builds |
| Docs | MkDocs Material | Beautiful documentation site |

---

## Feature Breakdown

### Phase 1: Core Foundation
- [ ] Project scaffolding (monorepo structure)
- [ ] FastAPI backend with health checks
- [ ] Database models (SQLAlchemy + Alembic migrations)
- [ ] Local user authentication (registration, login, JWT)
- [ ] Basic WebDAV endpoint with local filesystem provider
- [ ] React frontend with MUI setup and routing
- [ ] Login/Register pages
- [ ] Docker setup (Dockerfile + docker-compose for dev)

### Phase 2: Storage & WebDAV
- [ ] Storage provider abstraction layer
- [ ] S3 storage provider
- [ ] NFS/mount storage provider
- [ ] Azure Blob storage provider
- [ ] WebDAV endpoint with multi-backend support
- [ ] Per-user storage isolation (namespaces)
- [ ] File versioning system
- [ ] Storage quota management (optional limits)
- [ ] Basic Auth support for WebDAV clients

### Phase 3: Admin Portal
- [ ] Dashboard overview page (stats, activity)
- [ ] User management (CRUD, roles, permissions)
- [ ] Storage destination management
- [ ] Access control matrix (user ↔ storage mapping)
- [ ] Activity logs / audit trail
- [ ] System settings page

### Phase 4: OIDC Integration
- [ ] OIDC provider configuration (admin UI)
- [ ] OIDC login flow (authorization code)
- [ ] OIDC user provisioning (auto-create on first login)
- [ ] OIDC group → role mapping
- [ ] Bearer token auth for WebDAV
- [ ] Local user fallback when OIDC enabled

### Phase 5: Reports & SLA Monitoring
- [ ] File transfer activity tracking
- [ ] Last backup timestamp per user/destination
- [ ] SLA policy configuration (expected backup frequency)
- [ ] SLA violation alerts (email/webhook)
- [ ] Reports dashboard with charts:
  - Storage usage over time
  - Backup frequency per user
  - SLA compliance percentage
  - Transfer volume trends
  - Active users graph

### Phase 6: Theming & Branding
- [ ] Theme configuration via admin UI
  - Primary/secondary colors
  - Logo upload (header + login page)
  - Favicon customization
  - App name/title
- [ ] Dark/light mode toggle
- [ ] Theme persistence (database-backed)
- [ ] CSS variable-based theming (MUI createTheme)

### Phase 7: Documentation & Polish
- [ ] User documentation (MkDocs)
- [ ] API documentation (auto-generated OpenAPI)
- [ ] Admin guide
- [ ] Deployment guide (Docker, Kubernetes)
- [ ] Contributing guide
- [ ] README with badges, screenshots
- [ ] GitHub Actions CI/CD pipeline
- [ ] Release automation

---

## Project Structure

```
openwebdav/
├── .github/
│   └── workflows/
│       ├── ci.yml              # Lint, test, build
│       ├── docker.yml          # Build & push Docker image
│       └── release.yml         # Semantic versioning & release
├── backend/
│   ├── alembic/                # Database migrations
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py             # FastAPI app entry
│   │   ├── config.py           # Settings (pydantic-settings)
│   │   ├── database.py         # DB connection & session
│   │   ├── models/             # SQLAlchemy models
│   │   │   ├── user.py
│   │   │   ├── storage.py
│   │   │   ├── access.py
│   │   │   ├── activity.py
│   │   │   └── settings.py
│   │   ├── schemas/            # Pydantic schemas
│   │   ├── api/                # API routes
│   │   │   ├── v1/
│   │   │   │   ├── auth.py
│   │   │   │   ├── users.py
│   │   │   │   ├── storage.py
│   │   │   │   ├── reports.py
│   │   │   │   ├── settings.py
│   │   │   │   └── admin.py
│   │   │   └── deps.py         # Dependencies (auth, db)
│   │   ├── services/           # Business logic
│   │   │   ├── auth.py
│   │   │   ├── oidc.py
│   │   │   ├── storage.py
│   │   │   ├── webdav.py
│   │   │   ├── sla.py
│   │   │   └── theme.py
│   │   ├── providers/          # Storage backends
│   │   │   ├── base.py
│   │   │   ├── local.py
│   │   │   ├── s3.py
│   │   │   ├── nfs.py
│   │   │   └── azure.py
│   │   ├── webdav/             # WebDAV protocol handler
│   │   │   ├── handler.py
│   │   │   └── auth.py
│   │   └── tasks/              # Background tasks
│   │       ├── sla_monitor.py
│   │       └── cleanup.py
│   ├── tests/
│   ├── requirements.txt
│   ├── alembic.ini
│   └── pyproject.toml
├── frontend/
│   ├── public/
│   │   └── assets/             # Default logo, favicon
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── theme/
│   │   │   ├── index.ts        # MUI theme creation
│   │   │   ├── ThemeContext.tsx # Dynamic theme provider
│   │   │   └── defaults.ts     # Default colors/config
│   │   ├── api/                # API client (axios/fetch)
│   │   ├── hooks/              # Custom hooks
│   │   ├── stores/             # Zustand stores
│   │   ├── components/         # Shared components
│   │   │   ├── Layout/
│   │   │   ├── Charts/
│   │   │   └── Common/
│   │   ├── pages/
│   │   │   ├── Login/
│   │   │   ├── Dashboard/
│   │   │   ├── Users/
│   │   │   ├── Storage/
│   │   │   ├── Reports/
│   │   │   ├── Settings/
│   │   │   └── AccessControl/
│   │   └── utils/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
├── docs/
│   ├── mkdocs.yml
│   ├── docs/
│   │   ├── index.md
│   │   ├── getting-started.md
│   │   ├── configuration.md
│   │   ├── authentication.md
│   │   ├── storage-backends.md
│   │   ├── webdav-clients.md
│   │   ├── api-reference.md
│   │   ├── deployment.md
│   │   └── contributing.md
│   └── PLAN.md (this file)
├── docker/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── entrypoint.sh
├── docker-compose.yml          # Development compose
├── docker-compose.prod.yml     # Production compose
├── .env.example
├── LICENSE
├── README.md
└── CONTRIBUTING.md
```

---

## Database Schema (Key Models)

### Users
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| username | String | Unique |
| email | String | Unique |
| password_hash | String | Nullable (OIDC users) |
| auth_provider | Enum | local, oidc |
| oidc_subject | String | OIDC sub claim |
| role | Enum | admin, user, readonly |
| is_active | Boolean | Account status |
| quota_bytes | BigInt | Nullable = unlimited |
| created_at | DateTime | |
| last_login | DateTime | |

### Storage Destinations
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| name | String | Display name |
| provider_type | Enum | local, s3, nfs, azure |
| config | JSON | Provider-specific config |
| is_active | Boolean | |
| created_at | DateTime | |

### Access Control
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | FK → Users |
| storage_id | UUID | FK → Storage |
| permission | Enum | read, write, admin |
| path_prefix | String | Optional path restriction |

### Activity Log
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | FK → Users |
| storage_id | UUID | FK → Storage |
| action | Enum | upload, download, delete, mkdir |
| file_path | String | |
| file_size | BigInt | |
| timestamp | DateTime | |

### File Versions
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| storage_id | UUID | FK → Storage |
| file_path | String | |
| version | Integer | Auto-increment per file |
| size | BigInt | |
| checksum | String | SHA-256 |
| created_by | UUID | FK → Users |
| created_at | DateTime | |

### SLA Policies
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| name | String | Policy name |
| user_id | UUID | Nullable (applies to all if null) |
| storage_id | UUID | FK → Storage |
| expected_frequency_hours | Integer | Max hours between transfers |
| alert_webhook | String | Webhook URL for violations |
| alert_email | String | Email for violations |
| is_active | Boolean | |

### Theme Settings
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Singleton row |
| app_name | String | Default: "OpenWebDav" |
| primary_color | String | Hex color |
| secondary_color | String | Hex color |
| logo_path | String | Uploaded logo path |
| favicon_path | String | Uploaded favicon path |
| dark_mode_default | Boolean | |

---

## API Endpoints (v1)

### Authentication
- `POST /api/v1/auth/login` - Local login (returns JWT)
- `POST /api/v1/auth/register` - Register local user (if enabled)
- `POST /api/v1/auth/refresh` - Refresh JWT token
- `GET /api/v1/auth/oidc/login` - Initiate OIDC flow
- `GET /api/v1/auth/oidc/callback` - OIDC callback
- `POST /api/v1/auth/logout` - Logout

### Users
- `GET /api/v1/users` - List users (admin)
- `POST /api/v1/users` - Create user (admin)
- `GET /api/v1/users/{id}` - Get user details
- `PUT /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user
- `PUT /api/v1/users/{id}/quota` - Set quota

### Storage
- `GET /api/v1/storage` - List storage destinations
- `POST /api/v1/storage` - Create storage destination
- `GET /api/v1/storage/{id}` - Get storage details
- `PUT /api/v1/storage/{id}` - Update storage
- `DELETE /api/v1/storage/{id}` - Delete storage
- `POST /api/v1/storage/{id}/test` - Test connection

### Access Control
- `GET /api/v1/access` - List access rules
- `POST /api/v1/access` - Grant access
- `DELETE /api/v1/access/{id}` - Revoke access
- `GET /api/v1/access/matrix` - Full access matrix view

### Reports
- `GET /api/v1/reports/activity` - Activity summary
- `GET /api/v1/reports/storage-usage` - Storage usage over time
- `GET /api/v1/reports/sla-compliance` - SLA compliance report
- `GET /api/v1/reports/user-activity` - Per-user activity
- `GET /api/v1/reports/transfer-volume` - Transfer volume trends

### SLA
- `GET /api/v1/sla/policies` - List SLA policies
- `POST /api/v1/sla/policies` - Create policy
- `PUT /api/v1/sla/policies/{id}` - Update policy
- `DELETE /api/v1/sla/policies/{id}` - Delete policy
- `GET /api/v1/sla/violations` - Current violations

### Settings
- `GET /api/v1/settings/theme` - Get theme config
- `PUT /api/v1/settings/theme` - Update theme
- `POST /api/v1/settings/theme/logo` - Upload logo
- `GET /api/v1/settings/oidc` - Get OIDC config
- `PUT /api/v1/settings/oidc` - Update OIDC config
- `GET /api/v1/settings/general` - General settings

### WebDAV
- `* /dav/{username}/*` - WebDAV endpoint (all methods: GET, PUT, DELETE, MKCOL, PROPFIND, PROPPATCH, COPY, MOVE, LOCK, UNLOCK)

---

## Authentication Flow

### Local Auth
```
User → Login Form → POST /api/v1/auth/login → JWT Token → Stored in httpOnly cookie
```

### OIDC Auth
```
User → "Login with SSO" → GET /api/v1/auth/oidc/login → Redirect to IdP
     → User authenticates at IdP → Callback to /api/v1/auth/oidc/callback
     → Validate token, create/update user → JWT Token → Redirect to dashboard
```

### WebDAV Auth
```
Client → Basic Auth header → Validate against local users OR
Client → Bearer token → Validate JWT/OIDC token
```

---

## Docker Configuration

### Single Image Strategy
- **Stage 1:** Build React frontend (Node.js)
- **Stage 2:** Build Python backend (pip install)
- **Stage 3:** Production image (Python + Nginx)
  - Nginx serves static frontend files
  - Nginx proxies `/api/*` and `/dav/*` to FastAPI (Uvicorn)

### Environment Variables
```env
# Database
DATABASE_URL=sqlite:///./data/openwebdav.db  # or postgresql://...

# Security
SECRET_KEY=your-secret-key
JWT_EXPIRY_MINUTES=60

# OIDC (optional)
OIDC_ENABLED=false
OIDC_PROVIDER_URL=https://your-idp.com
OIDC_CLIENT_ID=
OIDC_CLIENT_SECRET=
OIDC_SCOPES=openid profile email

# Storage defaults
DEFAULT_STORAGE_PATH=/data/storage

# SLA
SLA_CHECK_INTERVAL_MINUTES=15
```

---

## CI/CD Pipeline

### ci.yml (on push/PR)
1. Lint backend (ruff, mypy)
2. Lint frontend (eslint, tsc)
3. Run backend tests (pytest)
4. Run frontend tests (vitest)
5. Build Docker image (smoke test)

### docker.yml (on tag/release)
1. Build multi-arch Docker image (amd64, arm64)
2. Push to GitHub Container Registry (ghcr.io)
3. Push to Docker Hub

### release.yml (on version tag)
1. Generate changelog
2. Create GitHub Release
3. Attach artifacts

---

## Development Roadmap

| Phase | Duration | Milestone |
|-------|----------|-----------|
| Phase 1 | 2-3 weeks | MVP: Local auth + basic WebDAV + admin shell |
| Phase 2 | 2-3 weeks | Multi-backend storage + versioning |
| Phase 3 | 2 weeks | Full admin portal |
| Phase 4 | 1-2 weeks | OIDC integration |
| Phase 5 | 2 weeks | Reports & SLA monitoring |
| Phase 6 | 1 week | Theming & branding |
| Phase 7 | 1 week | Documentation & release |

**Total estimated:** 11-14 weeks for full feature set

---

## Key Design Decisions

1. **WsgiDAV Integration:** Rather than implementing WebDAV from scratch, we integrate WsgiDAV (mature, RFC-compliant) via an ASGI adapter, adding our auth and storage provider layers on top.

2. **Storage Abstraction:** A provider interface allows adding new backends without modifying core logic. Each provider implements: `read`, `write`, `delete`, `list`, `mkdir`, `exists`, `stat`.

3. **Database Flexibility:** SQLite by default (zero-config), PostgreSQL for production. SQLAlchemy handles both transparently.

4. **Theme as Data:** Theme configuration stored in the database and served via API, allowing runtime changes without redeployment.

5. **SLA as First-Class:** Activity tracking is built into the storage layer from day one, making SLA reporting a natural extension rather than a bolt-on.

6. **OIDC as Optional:** The system works fully with local auth. OIDC is an additive layer that can be enabled/disabled without affecting existing users.

---

## Security Considerations

- Passwords hashed with bcrypt (cost factor 12)
- JWT tokens with short expiry + refresh token rotation
- CORS configured for frontend origin only
- Rate limiting on auth endpoints
- Input validation via Pydantic
- SQL injection prevention via SQLAlchemy ORM
- File path traversal prevention in WebDAV layer
- Secrets stored as environment variables (never in code)
- Docker runs as non-root user
- HTTPS enforced in production (via reverse proxy)

---

## Open Source Readiness

- [ ] MIT License file
- [ ] Comprehensive README with badges
- [ ] CONTRIBUTING.md with development setup
- [ ] CODE_OF_CONDUCT.md
- [ ] Issue templates (bug, feature request)
- [ ] PR template
- [ ] CHANGELOG.md (auto-generated)
- [ ] Security policy (SECURITY.md)
- [ ] Docker Hub / GHCR publishing
- [ ] Documentation site (GitHub Pages)
