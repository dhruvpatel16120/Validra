"""Create audit_logs table safely without altering existing tables."""

import asyncio
from sqlalchemy import text
from app.db.session import engine


async def create_table():
    statements = [
        """
        CREATE TABLE IF NOT EXISTS audit_logs (
            id VARCHAR(50) PRIMARY KEY,
            "logCode" VARCHAR(50) UNIQUE NOT NULL,
            timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            "userName" VARCHAR(255) NOT NULL,
            "userEmail" VARCHAR(255) NOT NULL,
            "userRole" VARCHAR(50) NOT NULL DEFAULT 'admin',
            action VARCHAR(100) NOT NULL,
            "entityType" VARCHAR(100) NOT NULL DEFAULT 'system',
            "entityId" VARCHAR(100) NOT NULL DEFAULT 'SYSTEM',
            "ipAddress" VARCHAR(50) NOT NULL DEFAULT '127.0.0.1',
            severity VARCHAR(20) NOT NULL DEFAULT 'INFO',
            status VARCHAR(30) NOT NULL DEFAULT 'SUCCESS',
            description TEXT NOT NULL,
            metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
            "acknowledgedBy" VARCHAR(255),
            "acknowledgedAt" TIMESTAMPTZ,
            "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        """,
        """CREATE INDEX IF NOT EXISTS idx_audit_logs_severity_status ON audit_logs (severity, status)""",
        """CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs (timestamp)""",
        """CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action)""",
    ]

    async with engine.begin() as conn:
        for stmt in statements:
            await conn.execute(text(stmt))
    print("SUCCESS: audit_logs table ready in PostgreSQL.")


if __name__ == "__main__":
    asyncio.run(create_table())
