"""Test configuration and fixtures."""

import asyncio
from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import Base, get_db
from app.main import app
from app.models.user import User
from app.services.auth import create_access_token, hash_password

# Test database URL (in-memory SQLite)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop():
    """Create an event loop for the test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def db_engine():
    """Create a test database engine."""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture
async def db_session(db_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session."""
    session_factory = async_sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        yield session


@pytest.fixture
async def client(db_engine) -> AsyncGenerator[AsyncClient, None]:
    """Create a test HTTP client with overridden database dependency."""
    session_factory = async_sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_db():
        async with session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

    app.dependency_overrides.clear()


@pytest.fixture
async def admin_user(db_engine) -> User:
    """Create an admin user for testing."""
    session_factory = async_sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        user = User(
            username="admin",
            email="admin@test.com",
            password_hash=hash_password("adminpass123"),
            role="admin",
            is_active=True,
            auth_provider="local",
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user


@pytest.fixture
async def regular_user(db_engine) -> User:
    """Create a regular user for testing."""
    session_factory = async_sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        user = User(
            username="testuser",
            email="testuser@test.com",
            password_hash=hash_password("userpass123"),
            role="user",
            is_active=True,
            auth_provider="local",
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user


@pytest.fixture
def admin_token(admin_user: User) -> str:
    """Generate a JWT token for the admin user."""
    return create_access_token(
        {"sub": admin_user.id, "username": admin_user.username, "role": admin_user.role}
    )


@pytest.fixture
def user_token(regular_user: User) -> str:
    """Generate a JWT token for the regular user."""
    return create_access_token(
        {"sub": regular_user.id, "username": regular_user.username, "role": regular_user.role}
    )


def auth_header(token: str) -> dict[str, str]:
    """Create an authorization header."""
    return {"Authorization": f"Bearer {token}"}
