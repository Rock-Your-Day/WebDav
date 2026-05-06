# Getting Started

## Prerequisites

- Docker 20.10+ (or Docker Desktop)
- 512MB RAM minimum (1GB recommended)
- Storage space for your data

## Installation

### Docker (Recommended)

```bash
docker run -d \
  --name openwebdav \
  -p 8080:80 \
  -v openwebdav_data:/data \
  -e SECRET_KEY=$(openssl rand -hex 32) \
  ghcr.io/your-org/openwebdav:latest
```

### Docker Compose

```yaml
version: "3.8"
services:
  openwebdav:
    image: ghcr.io/your-org/openwebdav:latest
    ports:
      - "8080:80"
    volumes:
      - openwebdav_data:/data
    environment:
      - SECRET_KEY=your-secret-key
    restart: unless-stopped

volumes:
  openwebdav_data:
```

## First Login

1. Open `http://localhost:8080` in your browser
2. Log in with the default credentials:
   - Username: `admin`
   - Password: `admin`
3. **Change the admin password immediately** via Settings

## Connecting a WebDAV Client

Your WebDAV endpoint is available at:

```
http://localhost:8080/dav/your-username/
```

Use Basic Auth with your username and password.

## Next Steps

- [Configure storage backends](storage-backends.md)
- [Set up OIDC authentication](authentication.md)
- [Configure SLA monitoring](configuration.md#sla)
