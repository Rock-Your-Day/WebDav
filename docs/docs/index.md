# OpenWebDav

**A modern, open-source WebDAV server with a beautiful admin portal.**

## What is OpenWebDav?

OpenWebDav is a self-hosted WebDAV server that provides:

- A modern admin dashboard for managing users, storage, and access
- Multiple storage backends (local, S3, NFS, Azure)
- Local user authentication and OIDC/SSO integration
- SLA monitoring and reporting
- File versioning
- Customizable theming and branding

## Quick Start

```bash
docker run -d \
  --name openwebdav \
  -p 8080:80 \
  -v openwebdav_data:/data \
  -e SECRET_KEY=change-me \
  ghcr.io/your-org/openwebdav:latest
```

Open `http://localhost:8080` and log in with `admin` / `admin`.

## Key Features

| Feature | Description |
|---------|-------------|
| WebDAV | RFC-compliant, works with all major clients |
| Multi-Backend | Local, S3, NFS, Azure Blob storage |
| Auth | Local users + OIDC/SSO |
| SLA | Monitor backup frequency, alert on violations |
| Reports | Visual dashboards with charts |
| Versioning | File history tracking |
| Theming | Customizable colors, logo, branding |
| Docker | Single image, easy deployment |
