from fastapi import APIRouter

router = APIRouter()


@router.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "Validra Backend API",
        "version": "0.1.0"
    }
