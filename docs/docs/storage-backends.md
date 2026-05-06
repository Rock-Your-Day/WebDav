# Storage Backends

OpenWebDav supports multiple storage backends. You can configure them via the admin portal under **Storage > Add Destination**.

## Local Filesystem

The simplest option. Files are stored directly on the server's filesystem.

**Configuration:**
- Path: Absolute path on the server (e.g., `/data/storage/backups`)

## AWS S3 / S3-Compatible

Store files in Amazon S3 or any S3-compatible service (MinIO, Wasabi, DigitalOcean Spaces, etc.).

**Configuration:**
- Bucket Name
- Region
- Access Key ID
- Secret Access Key
- Endpoint URL (for S3-compatible services)
- Path Prefix (optional)

## NFS Mounts

Use network-attached storage via NFS mounts.

**Configuration:**
- Mount Path: The local path where the NFS share is mounted

!!! note
    NFS shares must be mounted on the host and mapped into the Docker container via volumes.

## Azure Blob Storage

Store files in Microsoft Azure Blob Storage.

**Configuration:**
- Container Name
- Connection String (or Account Name + Account Key)
- Path Prefix (optional)

## Testing Connections

After configuring a storage destination, use the **Test Connection** button to verify connectivity before saving.
