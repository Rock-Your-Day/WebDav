"""WsgiDAV filesystem provider backed by OpenWebDav storage providers."""

import io
import os
from datetime import datetime

from wsgidav.dav_provider import DAVCollection, DAVNonCollection, DAVProvider

from app.config import settings


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
        return open(self._full_path, "rb")

    def begin_write(self, content_type=None):
        parent_dir = os.path.dirname(self._full_path)
        os.makedirs(parent_dir, exist_ok=True)
        return open(self._full_path, "wb")

    def delete(self):
        os.remove(self._full_path)

    def copy_move_single(self, dest_path, is_move):
        dest_full = os.path.join(self._base_path, dest_path.lstrip("/"))
        os.makedirs(os.path.dirname(dest_full), exist_ok=True)
        if is_move:
            os.rename(self._full_path, dest_full)
        else:
            import shutil
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
        member_path = os.path.join(self._full_path, name)
        # Create empty file
        open(member_path, "wb").close()
        dav_path = self.path.rstrip("/") + "/" + name
        rel_path = os.path.relpath(member_path, self._base_path)
        return OpenWebDavFile(dav_path, self.environ, rel_path, self._base_path)

    def create_collection(self, name):
        member_path = os.path.join(self._full_path, name)
        os.makedirs(member_path, exist_ok=True)
        dav_path = self.path.rstrip("/") + "/" + name
        rel_path = os.path.relpath(member_path, self._base_path)
        return OpenWebDavCollection(dav_path, self.environ, rel_path, self._base_path)

    def delete(self):
        import shutil
        shutil.rmtree(self._full_path)

    def copy_move_single(self, dest_path, is_move):
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

    URL structure: /dav/{username}/...
    Maps to: {DEFAULT_STORAGE_PATH}/{username}/...
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
        # Strip leading /dav prefix if present (handled by mount)
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
