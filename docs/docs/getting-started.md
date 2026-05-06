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

### Setup Steps

1. **Create a storage destination** in the admin UI (Storage → Add Storage)
   - Choose "Local Filesystem" and set the path (e.g. `/data/storage/backups`)
2. **Assign the storage to your user** (Users → Edit → set Storage Destination)
3. **Connect your WebDAV client** to:

```
http://your-server:8080/dav/
```

Use Basic Auth with your username and password.

### How It Works

OpenWebDav acts as a **proxy** — your credentials determine who you are, and your assigned storage destination determines where files go. No special URL path needed.

- Each user has **one** assigned storage destination
- When you write files via WebDAV, they land in `{storage_path}/{username}/`
- If no storage is assigned, files go to the default path `/data/storage/{username}/`

### Tested Clients

- **macOS Finder**: Go → Connect to Server → `http://server:8080/dav/`
- **Notability / GoodNotes**: Add WebDAV backup with URL `http://server:8080/dav/`
- **Cyberduck**: New connection → WebDAV (HTTP) → Server: `server`, Port: `8080`, Path: `/dav/`
- **rclone**: `rclone config` → WebDAV → URL: `http://server:8080/dav/`
- **Windows**: Map Network Drive → `http://server:8080/dav/`

## Next Steps

- [Configure storage backends](storage-backends.md)
- [Set up OIDC authentication](authentication.md)
- [Configure SLA monitoring](configuration.md#sla)
