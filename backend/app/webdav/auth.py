"""WebDAV authentication — supports Basic Auth and Bearer tokens."""

import asyncio
import threading

from wsgidav.dc.base_dc import BaseDomainController

from app.services.auth import decode_token, verify_password


# Thread-local event loop for running async code from sync context
_local = threading.local()


def _run_async(coro):
    """Run an async coroutine from a synchronous context."""
    try:
        loop = getattr(_local, "loop", None)
        if loop is None or loop.is_closed():
            loop = asyncio.new_event_loop()
            _local.loop = loop
        return loop.run_until_complete(coro)
    except RuntimeError:
        # If we're already in an async loop, create a new one in a thread
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
            return pool.submit(asyncio.run, coro).result()


class OpenWebDavDomainController(BaseDomainController):
    """
    Domain controller that authenticates WebDAV requests using:
    1. Bearer token (JWT) in Authorization header
    2. Basic Auth (username/password) against local users
    """

    def __init__(self, wsgidav_app, config):
        super().__init__(wsgidav_app, config)

    def __str__(self):
        return "OpenWebDavDomainController"

    def get_domain_realm(self, path_info, environ):
        return "OpenWebDav"

    def require_authentication(self, realm, environ):
        """Always require authentication for WebDAV."""
        # Check for Bearer token first
        auth_header = environ.get("HTTP_AUTHORIZATION", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
            payload = decode_token(token)
            if payload and payload.get("type") == "access":
                environ["wsgidav.auth.user_name"] = payload.get("username", "")
                return False  # No further auth needed
        return True

    def basic_auth_user(self, realm, user_name, password, environ):
        """Validate Basic Auth credentials against the database."""

        async def _check():
            from sqlalchemy import select

            from app.database import async_session
            from app.models.user import User

            async with async_session() as session:
                result = await session.execute(
                    select(User).where(
                        User.username == user_name,
                        User.is_active.is_(True),
                    )
                )
                user = result.scalar_one_or_none()
                if user and user.password_hash and verify_password(password, user.password_hash):
                    return user.username
                return None

        result = _run_async(_check())
        return result

    def supports_http_digest_auth(self):
        return False

    def is_share_anonymous(self, path_info):
        return False
