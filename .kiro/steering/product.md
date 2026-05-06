---
inclusion: auto
---

# Product: OpenWebDav

OpenWebDav is a self-hosted, open-source WebDAV server with a Material UI v7 admin portal, shipped as a single Docker image.

## Core Capabilities

- RFC-compliant WebDAV server (via WsgiDAV) for file access from standard clients
- Multiple storage backends: local filesystem, AWS S3, NFS, Azure Blob
- User management with role-based access control (admin, user, readonly)
- OIDC/SSO integration for enterprise authentication
- SLA monitoring with alerting for missed backup schedules
- Reports and analytics dashboard (storage usage, activity trends, SLA compliance)
- File versioning and optional per-user storage quotas
- Customizable theming (colors, logo, dark/light mode)

## Authentication

- Local username/password with JWT tokens (access + refresh)
- OIDC flow for SSO providers (Keycloak, Okta, Azure AD)
- WebDAV supports Basic Auth and Bearer Token
- Rate limiting on auth endpoints (20 req/min)

## Security

- Security headers on all responses (HSTS, X-Frame-Options, CSP-adjacent)
- Input validation via Pydantic schemas (regex patterns, length limits)
- RBAC enforcement via FastAPI dependencies
- Bandit SAST, Semgrep, pip-audit, npm audit, Gitleaks, Trivy in CI
- Container scanning before any artifact is published

## Deployment

- Single Docker container with Nginx reverse proxy
- Routes: `/` → React SPA, `/api/*` → FastAPI, `/dav/*` → WsgiDAV
- SQLite for development, PostgreSQL for production
- Configuration via environment variables or `.env` file
- Multi-arch builds (amd64 + arm64) published to GHCR

## Testing

- 34 backend unit/integration tests (pytest)
- 10 frontend unit tests (vitest + testing-library + MSW)
- 22 E2E tests (Playwright against running container)
- All tests must pass before container artifact is published
