from app.routers.health import router as health_router
from app.routers.reports import router as reports_router
from app.routers.auth import router as auth_router
from app.routers.stream_reports import router as stream_reports_router

__all__ = ["health_router", "reports_router", "auth_router", "stream_reports_router"]
