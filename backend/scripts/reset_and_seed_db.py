"""Master script to empty database, push frontend & backend schemas, and seed users & rules."""

import asyncio
import os
import subprocess
import sys
from pathlib import Path
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

# Set up paths
current_dir = Path(__file__).resolve().parent
backend_dir = current_dir.parent
root_dir = backend_dir.parent
frontend_dir = root_dir / "frontend"

if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.core.config import settings
import asyncpg
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from app.services.seed_rules import seed_default_rules
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker


async def empty_and_recreate_db():
    print("=" * 60)
    print("🗑️  STEP 1: Emptying PostgreSQL database (public schema)...")
    print("=" * 60)

    # Convert settings.DATABASE_URL to clean asyncpg DSN
    raw_url = settings.DATABASE_URL
    parsed = urlparse(raw_url.replace("postgresql+asyncpg://", "postgresql://"))
    dsn = urlunparse((
        parsed.scheme,
        parsed.netloc,
        parsed.path,
        parsed.params,
        "ssl=require",
        parsed.fragment
    ))

    conn = await asyncpg.connect(dsn)
    try:
        await conn.execute("""
            DROP SCHEMA IF EXISTS public CASCADE;
            CREATE SCHEMA public;
            GRANT ALL ON SCHEMA public TO postgres;
            GRANT ALL ON SCHEMA public TO public;
        """)
        print("✅ Database public schema wiped and recreated clean.")

        # Pre-create UserRole enum type for compatibility
        await conn.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
                    CREATE TYPE "UserRole" AS ENUM ('INSPECTOR', 'ADMIN');
                END IF;
            END
            $$;
        """)
        print("✅ UserRole enum created.")
    finally:
        await conn.close()


def push_frontend_prisma():
    print("\n" + "=" * 60)
    print("📦 STEP 2: Pushing Prisma Schema (Frontend)...")
    print("=" * 60)

    cmd = "npx prisma db push --accept-data-loss"
    res = subprocess.run(cmd, shell=True, cwd=str(frontend_dir), check=True)
    print("✅ Prisma schema pushed successfully (users, audit_logs).")


async def push_backend_sqlalchemy():
    print("\n" + "=" * 60)
    print("⚙️  STEP 3: Pushing SQLAlchemy Schema & Seeding Rules (Backend)...")
    print("=" * 60)

    engine = create_async_engine(
        settings.DATABASE_URL,
        connect_args={"statement_cache_size": 0}
    )

    from app.models import Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        print("✅ SQLAlchemy tables created (rules, inspections, images, scan_results, etc.).")

    session_maker = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    async with session_maker() as session:
        await seed_default_rules(session)
        print("✅ Default Legal Metrology rules seeded.")

    await engine.dispose()


def seed_users():
    print("\n" + "=" * 60)
    print("👤 STEP 4: Creating Admin & Inspector Users...")
    print("=" * 60)

    cmd = "node scripts/seed-initial-users.js"
    subprocess.run(cmd, shell=True, cwd=str(frontend_dir), check=True)


async def main():
    await empty_and_recreate_db()
    push_frontend_prisma()
    await push_backend_sqlalchemy()
    seed_users()
    print("\n" + "=" * 60)
    print("🎉 ALL STEPS COMPLETED SUCCESSFULLY!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
