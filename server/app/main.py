from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import get_settings
from app.database import init_db, check_db_connection, SessionLocal
from app.routers.health import router as health_router
from app.routers.reports import router as reports_router
from app.routers.auth import router as auth_router
from app.routers.stream_reports import router as stream_reports_router
import app.models  # Ensure all models (User, Log, Schedule, stream reports) are registered for init_db()
from app.services.report_service import report_service
from app.utils.logger import logger

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context for startup and shutdown lifecycle."""
    logger.info(
        f"Starting TNPCB Reporting Portal API in [{settings.app_env.upper()}] environment"
    )
    # Check DB and initialize tables if available
    db_status = check_db_connection()
    if db_status.get("status") == "connected":
        logger.info("Database connection established. Initializing tables...")
        try:
            init_db()
            db = SessionLocal()
            try:
                report_service.seed_initial_data(db)
            finally:
                db.close()
            logger.info("Database tables verified and seeded successfully.")
        except Exception as e:
            logger.error(f"Error during database initialization: {e}")
    else:
        logger.warning(
            f"Database not immediately reachable: {db_status.get('error')}. Skipping auto-migration on startup."
        )

    yield

    logger.info("Shutting down TNPCB Reporting Portal API.")


app = FastAPI(
    title="TNPCB CM Dashboard Reporting Portal API",
    description="Backend API for Tamil Nadu Pollution Control Board Monthly Waste Management Reporting",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# Configure CORS Middleware
origins = settings.get_cors_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "status": "error",
            "message": "Internal Server Error",
            "detail": str(exc) if settings.app_env != "production" else "An unexpected error occurred.",
        },
    )


# Register API Routers under /api prefix
app.include_router(health_router, prefix="/api")
app.include_router(reports_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(stream_reports_router, prefix="/api")


@app.get("/")
def root():
    """Root redirect / index information."""
    return {
        "portal": "TNPCB CM Dashboard-TNEGA Reporting Portal",
        "environment": settings.app_env,
        "docs": "/api/docs",
        "health": "/api/health",
    }
