"""AWS S3 storage provider."""

from collections.abc import AsyncIterator
from datetime import datetime

from app.providers.base import FileInfo, StorageProvider


class S3StorageProvider(StorageProvider):
    """Storage provider for AWS S3 and S3-compatible services."""

    def __init__(self, bucket: str, prefix: str = "", **kwargs):
        self.bucket = bucket
        self.prefix = prefix.strip("/")
        self.config = kwargs
        self._client = None

    def _get_client(self):
        """Lazy-initialize boto3 client."""
        if self._client is None:
            import boto3

            session_kwargs = {}
            if self.config.get("aws_access_key_id"):
                session_kwargs["aws_access_key_id"] = self.config["aws_access_key_id"]
                session_kwargs["aws_secret_access_key"] = self.config["aws_secret_access_key"]
            if self.config.get("region_name"):
                session_kwargs["region_name"] = self.config["region_name"]

            client_kwargs = {}
            if self.config.get("endpoint_url"):
                client_kwargs["endpoint_url"] = self.config["endpoint_url"]

            session = boto3.Session(**session_kwargs)
            self._client = session.client("s3", **client_kwargs)
        return self._client

    def _key(self, path: str) -> str:
        """Build full S3 key from relative path."""
        path = path.strip("/")
        if self.prefix:
            return f"{self.prefix}/{path}"
        return path

    async def read(self, path: str) -> AsyncIterator[bytes]:
        """Read file from S3."""
        client = self._get_client()
        response = client.get_object(Bucket=self.bucket, Key=self._key(path))
        body = response["Body"]
        while chunk := body.read(8192):
            yield chunk

    async def write(self, path: str, content: AsyncIterator[bytes]) -> int:
        """Write file to S3."""
        client = self._get_client()
        # Collect content (for simplicity; production should use multipart)
        data = b""
        async for chunk in content:
            data += chunk
        client.put_object(Bucket=self.bucket, Key=self._key(path), Body=data)
        return len(data)

    async def delete(self, path: str) -> None:
        """Delete object from S3."""
        client = self._get_client()
        client.delete_object(Bucket=self.bucket, Key=self._key(path))

    async def list(self, path: str) -> list[FileInfo]:
        """List objects in S3 prefix."""
        client = self._get_client()
        prefix = self._key(path).rstrip("/") + "/"
        response = client.list_objects_v2(Bucket=self.bucket, Prefix=prefix, Delimiter="/")
        items = []
        for obj in response.get("Contents", []):
            name = obj["Key"].split("/")[-1]
            if name:
                items.append(
                    FileInfo(
                        path=obj["Key"],
                        name=name,
                        size=obj["Size"],
                        is_directory=False,
                        modified_at=obj["LastModified"],
                    )
                )
        for prefix_obj in response.get("CommonPrefixes", []):
            name = prefix_obj["Prefix"].rstrip("/").split("/")[-1]
            items.append(
                FileInfo(
                    path=prefix_obj["Prefix"],
                    name=name,
                    size=0,
                    is_directory=True,
                    modified_at=datetime.utcnow(),
                )
            )
        return items

    async def mkdir(self, path: str) -> None:
        """Create a 'directory' in S3 (zero-byte object with trailing /)."""
        client = self._get_client()
        key = self._key(path).rstrip("/") + "/"
        client.put_object(Bucket=self.bucket, Key=key, Body=b"")

    async def exists(self, path: str) -> bool:
        """Check if object exists in S3."""
        client = self._get_client()
        try:
            client.head_object(Bucket=self.bucket, Key=self._key(path))
            return True
        except client.exceptions.ClientError:
            return False

    async def stat(self, path: str) -> FileInfo:
        """Get object metadata from S3."""
        client = self._get_client()
        response = client.head_object(Bucket=self.bucket, Key=self._key(path))
        return FileInfo(
            path=path,
            name=path.split("/")[-1],
            size=response["ContentLength"],
            is_directory=False,
            modified_at=response["LastModified"],
            content_type=response.get("ContentType"),
        )

    async def move(self, src: str, dst: str) -> None:
        """Move object in S3 (copy + delete)."""
        await self.copy(src, dst)
        await self.delete(src)

    async def copy(self, src: str, dst: str) -> None:
        """Copy object in S3."""
        client = self._get_client()
        client.copy_object(
            Bucket=self.bucket,
            CopySource={"Bucket": self.bucket, "Key": self._key(src)},
            Key=self._key(dst),
        )

    async def test_connection(self) -> bool:
        """Test S3 connectivity."""
        try:
            client = self._get_client()
            client.head_bucket(Bucket=self.bucket)
            return True
        except Exception:
            return False
