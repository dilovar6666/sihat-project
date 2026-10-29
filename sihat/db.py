from collections.abc import AsyncGenerator, Generator
from typing import Any

from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from sihat.config import get_settings


class Base(DeclarativeBase):
    pass


def to_async_database_url(url: str) -> str:
    """Normalize database URL for SQLAlchemy 2.x async drivers."""
    if url.startswith("sqlite+aiosqlite://") or url.startswith("postgresql+asyncpg://"):
        return url
    if url.startswith("sqlite://"):
        return url.replace("sqlite://", "sqlite+aiosqlite://", 1)
    if url.startswith("postgresql+psycopg://"):
        return url.replace("postgresql+psycopg://", "postgresql+asyncpg://", 1)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


def to_sync_database_url(url: str) -> str:
    """Normalize database URL for sync tools like Alembic or seeding scripts."""
    if url.startswith("sqlite+aiosqlite://"):
        return url.replace("sqlite+aiosqlite://", "sqlite://", 1)
    if url.startswith("postgresql+asyncpg://"):
        return url.replace("postgresql+asyncpg://", "postgresql+psycopg://", 1)
    return url


settings = get_settings()

# Async Engine and Session for FastAPI
async_url = to_async_database_url(settings.database_url)
async_connect_args: dict[str, Any] = (
    {"check_same_thread": False} if async_url.startswith("sqlite") else {}
)

async_engine: AsyncEngine = create_async_engine(
    async_url,
    pool_pre_ping=True,
    connect_args=async_connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Alias for backwards compatibility where engine was imported
engine = async_engine


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Fastapi dependency providing an isolated AsyncSession per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise


# Sync Engine and SessionLocal for Alembic migrations and CLI scripts
sync_url = to_sync_database_url(settings.database_url)
sync_connect_args: dict[str, Any] = (
    {"check_same_thread": False} if sync_url.startswith("sqlite") else {}
)
sync_engine = create_engine(sync_url, pool_pre_ping=True, connect_args=sync_connect_args)
SessionLocal = sessionmaker(bind=sync_engine, autocommit=False, autoflush=False)


def get_sync_db_session() -> Generator[Session, None, None]:
    with SessionLocal() as session:
        yield session
