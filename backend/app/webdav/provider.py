"""WsgiDAV filesystem provider backed by OpenWebDav storage providers."""

import os

from wsgidav.dav_error import HTTP_FORBIDDEN, HTTP_INSUFFICIENT_STORAGE, DAVError
from wsgidav.dav_provider import DAVCollection, DAVNonCollection, DAVProvider

from app.config import settings


class _TrackedWriteFile:
    """File wrapper that saves previous version and records activity after write completes."""

    def __init__(self, full_path, environ, rel_path, base_path):
        self._full_path = full_path
        self._environ = environ
        self._rel_path = rel_path
        self._base_path = base_path
        self._username = environ.get("wsgidav.auth.user_name", "")

        # Save previous version before overwriting
        from app.services.versioning import record_version_in_db, save_version

        version_data = save_version(base_path, rel_path, self._username)
        if version_data:
            record_version_in_db(version_data)

        self._file = open(full_path, "wb")
        self._bytes_written = 0

    def write(self, data):
        self._bytes_written += len(data)
        return self._file.write(data)

    def close(self):
        self._file.close()
        from app.webdav.middleware import record_activity

        record_activity(self._environ, "upload", self._rel_path, self._bytes_written)

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()


def _get_username(environ):
    """Extract authenticated username from WSGI environ."""
    return environ.get("wsgidav.auth.user_name", "")


def _check_read(environ, path):
    """Check read permission, raise DAVError if denied."""
    from app.webdav.permissions import check_permission

    username = _get_username(environ)
    if not check_permission(username, path, "read"):
        raise DAVError(HTTP_FORBIDDEN, f"Access denied for {username}")


def _check_write(environ, path):
    """Check write permission, raise DAVError if denied."""
    from app.webdav.permissions import check_permission

    username = _get_username(environ)
    if not check_permission(username, path, "write"):
        raise DAVError(HTTP_FORBIDDEN, f"Write access denied for {username}")


def _check_quota(environ, size):
    """Check quota, raise DAVError if exceeded."""
    from app.webdav.permissions import check_quota

    username = _get_username(environ)
    if not check_quota(username, size):
        raise DAVError(HTTP_INSUFFICIENT_STORAGE, "Storage quota exceeded")


class OpenWebDavFile(DAVNonCollection):
    """A file resource in the WebDAV tree."""

    def __init__(self, path, environ, file_path, base_path):
        super().__init__(path, environ)
        self._file_path = file_path
        self._base_path = base_path
        self._full_path = os.path.join(base_path, file_path.lstrip("/"))

    def get_content_length(self):
        try:
            return os.path.getsize(self._full_path)
        except OSError:
            return 0

    def get_content_type(self):
        import mimetypes

        content_type, _ = mimetypes.guess_type(self._full_path)
        return content_type or "application/octet-stream"

    def get_creation_date(self):
        try:
            return os.path.getctime(self._full_path)
        except OSError:
            return None

    def get_display_name(self):
        return os.path.basename(self._full_path)

    def get_etag(self):
        try:
            stat = os.stat(self._full_path)
            return f"{stat.st_mtime:.6f}-{stat.st_size}"
        except OSError:
            return None

    def get_last_modified(self):
        try:
            return os.path.getmtime(self._full_path)
        except OSError:
            return None

    def get_content(self):
        _check_read(self.environ, self._file_path)
        from app.webdav.middleware import record_activity

        record_activity(self.environ, "download", self._file_path, self.get_content_length())
        return open(self._full_path, "rb")

    def begin_write(self, content_type=None):
        _check_write(self.environ, self._file_path)
        parent_dir = os.path.dirname(self._full_path)
        os.makedirs(parent_dir, exist_ok=True)
        return _TrackedWriteFile(self._full_path, self.environ, self._file_path, self._base_path)

    def delete(self):
        _check_write(self.environ, self._file_path)
        from app.webdav.middleware import record_activity

        record_activity(self.environ, "delete", self._file_path, self.get_content_length())
        os.remove(self._full_path)

    def copy_move_single(self, dest_path, is_move):
        _check_write(self.environ, dest_path.lstrip("/"))
        dest_full = os.path.join(self._base_path, dest_path.lstrip("/"))
        os.makedirs(os.path.dirname(dest_full), exist_ok=True)
        if is_move:
            from app.webdav.middleware import record_activity

            record_activity(self.environ, "move", self._file_path, self.get_content_length())
            os.rename(self._full_path, dest_full)
        else:
            import shutil

            from app.webdav.middleware import record_activity

            record_activity(self.environ, "copy", self._file_path, self.get_content_length())
            shutil.copy2(self._full_path, dest_full)

    def support_etag(self):
        return True

    def support_ranges(self):
        return True


class OpenWebDavCollection(DAVCollection):
    """A directory resource in the WebDAV tree."""

    def __init__(self, path, environ, dir_path, base_path):
        super().__init__(path, environ)
        self._dir_path = dir_path
        self._base_path = base_path
        self._full_path = os.path.join(base_path, dir_path.lstrip("/"))

    def get_creation_date(self):
        try:
            return os.path.getctime(self._full_path)
        except OSError:
            return None

    def get_display_name(self):
        return os.path.basename(self._full_path) or "/"

    def get_last_modified(self):
        try:
            return os.path.getmtime(self._full_path)
        except OSError:
            return None

    def get_member_names(self):
        _check_read(self.environ, self._dir_path)
        try:
            return os.listdir(self._full_path)
        except OSError:
            return []

    def get_member(self, name):
        member_path = os.path.join(self._full_path, name)
        dav_path = self.path.rstrip("/") + "/" + name

        if os.path.isdir(member_path):
            rel_path = os.path.relpath(member_path, self._base_path)
            return OpenWebDavCollection(dav_path, self.environ, rel_path, self._base_path)
        elif os.path.isfile(member_path):
            rel_path = os.path.relpath(member_path, self._base_path)
            return OpenWebDavFile(dav_path, self.environ, rel_path, self._base_path)
        return None

    def create_empty_resource(self, name):
        _check_write(self.environ, self._dir_path)
        member_path = os.path.join(self._full_path, name)
        open(member_path, "wb").close()
        dav_path = self.path.rstrip("/") + "/" + name
        rel_path = os.path.relpath(member_path, self._base_path)
        return OpenWebDavFile(dav_path, self.environ, rel_path, self._base_path)

    def create_collection(self, name):
        _check_write(self.environ, self._dir_path)
        member_path = os.path.join(self._full_path, name)
        os.makedirs(member_path, exist_ok=True)
        dav_path = self.path.rstrip("/") + "/" + name
        rel_path = os.path.relpath(member_path, self._base_path)
        from app.webdav.middleware import record_activity

        record_activity(self.environ, "mkdir", rel_path)
        return OpenWebDavCollection(dav_path, self.environ, rel_path, self._base_path)

    def delete(self):
        _check_write(self.environ, self._dir_path)
        import shutil

        from app.webdav.middleware import record_activity

        record_activity(self.environ, "delete", self._dir_path)
        shutil.rmtree(self._full_path)

    def copy_move_single(self, dest_path, is_move):
        _check_write(self.environ, dest_path.lstrip("/"))
        import shutil

        dest_full = os.path.join(self._base_path, dest_path.lstrip("/"))
        os.makedirs(os.path.dirname(dest_full), exist_ok=True)
        if is_move:
            os.rename(self._full_path, dest_full)
        else:
            shutil.copytree(self._full_path, dest_full)


class OpenWebDavProvider(DAVProvider):
    """
    WsgiDAV provider that serves per-user directories from the configured storage path.

    URL structure: /dav/{username}/path/to/file
    Maps to: {DEFAULT_STORAGE_PATH}/{username}/path/to/file

    Access control:
    - Users have full access to /dav/{their-username}/*
    - Admins have full access to everything
    - Other access requires explicit access control rules
    """

    def __init__(self):
        super().__init__()
        self.base_path = settings.default_storage_path

        # Fall back to local data/storage if configured path isn't writable
        try:
            os.makedirs(self.base_path, exist_ok=True)
        except OSError:
            import pathlib

            fallback = str(pathlib.Path(__file__).parent.parent.parent / "data" / "storage")
            os.makedirs(fallback, exist_ok=True)
            self.base_path = fallback

    def get_resource_inst(self, path, environ):
        """Return a DAVResource for the given path."""
        rel_path = path.lstrip("/")
        full_path = os.path.join(self.base_path, rel_path)

        # Prevent path traversal
        real_base = os.path.realpath(self.base_path)
        real_path = os.path.realpath(full_path)
        if not real_path.startswith(real_base):
            return None

        if os.path.isdir(full_path):
            return OpenWebDavCollection(path, environ, rel_path, self.base_path)
        elif os.path.isfile(full_path):
            return OpenWebDavFile(path, environ, rel_path, self.base_path)
        elif path == "/" or rel_path == "":
            # Root — always exists
            return OpenWebDavCollection(path, environ, "", self.base_path)

        return None
