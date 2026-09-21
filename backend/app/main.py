"""Main FastAPI application for Validra Legal Metrology Compliance Scanner."""

from contextlib import asynccontextmanager
import logging
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.router import router
from app.core.config import settings
from app.db.session import AsyncSessionLocal, init_db
from app.services.seed_rules import seed_default_rules

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("validra.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure uploads directory exists
    upload_path = Path(settings.UPLOAD_DIR)
    upload_path.mkdir(parents=True, exist_ok=True)

    # Initialize database tables
    try:
        await init_db()
        logger.info("Database tables initialized successfully.")
    except Exception as exc:
        logger.error(f"Database initialization error (PostgreSQL): {exc}")

    # Seed default Legal Metrology rules
    try:
        async with AsyncSessionLocal() as session:
            await seed_default_rules(session)
    except Exception as exc:
        logger.error(f"Rule seeding error: {exc}")

    yield

    from app.db.session import engine
    await engine.dispose()
    logger.info("Database connection closed.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Validra Legal Metrology (Packaged Commodities) Compliance Scanner API",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount feature routes under /api
app.include_router(router, prefix=settings.API_STR)

# Mount uploads directory for static panel evidence images
upload_path = Path(settings.UPLOAD_DIR)
upload_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(upload_path)), name="uploads")


@app.get("/health", tags=["Health"], summary="Health check endpoint")
async def health_check():
    return {"status": "ok", "app": settings.PROJECT_NAME}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
