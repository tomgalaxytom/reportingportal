from datetime import datetime, timezone
from fastapi import APIRouter
from app.config import get_settings
from app.database import check_db_connection
from app.schemas.health import HealthResponse, DbHealthResponse

router = APIRouter(tags=["Health"])
settings = get_settings()


@router.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    """Return backend health status and active environment configuration."""
    db_status = check_db_connection()
    return HealthResponse(
        status="ok",
        environment=settings.app_env,
        database=db_status.get("status", "unknown"),
        timestamp=datetime.now(timezone.utc).isoformat(),
        version="1.0.0",
    )


@router.get("/health/db", response_model=DbHealthResponse)
def get_db_health() -> DbHealthResponse:
    """Check live database connectivity."""
    db_status = check_db_connection()
    return DbHealthResponse(
        status=db_status.get("status", "disconnected"),
        error=db_status.get("error"),
    )
