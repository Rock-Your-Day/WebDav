"""WsgiDAV application setup and ASGI mounting."""

from a2wsgi import WSGIMiddleware
from wsgidav.wsgidav_app import WsgiDAVApp

from app.webdav.auth import OpenWebDavDomainController
from app.webdav.provider import OpenWebDavProvider


def create_webdav_app() -> WSGIMiddleware:
    """Create and configure the WsgiDAV application wrapped as ASGI."""
    config = {
        "provider_mapping": {
            "/": OpenWebDavProvider(),
        },
        "http_authenticator": {
            "domain_controller": OpenWebDavDomainController,
            "accept_basic": True,
            "accept_digest": False,
            "default_to_digest": False,
        },
        "verbose": 1,
        "logging": {
            "enable": True,
            "enable_loggers": [],
        },
        # Allow these methods
        "allowed_methods": [
            "GET",
            "HEAD",
            "PUT",
            "DELETE",
            "MKCOL",
            "PROPFIND",
            "PROPPATCH",
            "COPY",
            "MOVE",
            "LOCK",
            "UNLOCK",
            "OPTIONS",
        ],
        # Disable the built-in dir browser (we have our own UI)
        "dir_browser": {
            "enable": False,
        },
    }

    wsgidav_app = WsgiDAVApp(config)
    return WSGIMiddleware(wsgidav_app)
