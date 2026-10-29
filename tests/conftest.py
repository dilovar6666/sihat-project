import asyncio
import os
import tempfile
from collections.abc import AsyncGenerator, Generator
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from sihat.assistant import clear_assistant_rate_limits
from sihat.config import Settings, get_settings
from sihat.content import clear_support_rate_limits
from sihat.db import Base, get_db_session
from sihat.main import app
from sihat.rate_limit import clear_auth_rate_limits

_temp_db_path = os.path.join(tempfile.gettempdir(), "sihat_pytest.db").replace("\\", "/")
_test_engine: AsyncEngine | None = None
_test_session_maker: async_sessionmaker[AsyncSession] | None = None


def get_test_engine() -> AsyncEngine:
    global _test_engine
    if _test_engine is None:
        _test_engine = create_async_engine(
            f"sqlite+aiosqlite:///{_temp_db_path}",
            connect_args={"check_same_thread": False},
        )
    return _test_engine


def get_test_sessionmaker() -> async_sessionmaker[AsyncSession]:
    global _test_session_maker
    if _test_session_maker is None:
        _test_session_maker = async_sessionmaker(
            bind=get_test_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False,
        )
    return _test_session_maker


async def execute_in_db(callback: Any) -> Any:
    """Execute a callback with an AsyncSession in the test database."""
    session_maker = get_test_sessionmaker()
    async with session_maker() as session:
        result = await callback(session)
        await session.commit()
        return result


def sync_db_exec(callback: Any) -> Any:
    """Synchronous helper for tests to execute DB operations."""
    return asyncio.run(execute_in_db(callback))


@pytest.fixture(autouse=True)
def setup_test_db() -> Generator[None, None, None]:
    """Ensures a clean database schema and clean rate limit buckets for every test."""
    engine = get_test_engine()

    async def init_schema():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)

    asyncio.run(init_schema())
    clear_auth_rate_limits()
    clear_support_rate_limits()
    clear_assistant_rate_limits()

    yield

    clear_auth_rate_limits()
    clear_support_rate_limits()
    clear_assistant_rate_limits()


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    """Provides a TestClient wired to the test AsyncSession."""
    session_maker = get_test_sessionmaker()

    async def override_db_session() -> AsyncGenerator[AsyncSession, None]:
        async with session_maker() as session:
            try:
                yield session
            except Exception:
                await session.rollback()
                raise

    test_settings = Settings(
        jwt_secret="test-only-jwt-secret-with-more-than-thirty-two-characters",
        smtp_host="smtp.test",
        smtp_username="test-user",
        smtp_password="test-password",
        smtp_from_email="noreply@test.invalid",
        google_oauth_client_id=None,
        gemini_api_key=None,
    )

    app.dependency_overrides[get_db_session] = override_db_session
    app.dependency_overrides[get_settings] = lambda: test_settings

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
