import os
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging
from app.core.config import settings
from app.api.router import api_router

# Setup safe logger (prevent leaking sensitive data)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("aiia_ctms")

app = FastAPI(
    title="AIIA Clinical Trials Management System (CTMS)",
    description=(
        "Production-grade Clinical Trial Management System for Ayurveda Research under "
        "the Ministry of Ayush & All India Institute of Ayurveda (AIIA). Phase 1: Foundation, "
        "Authentication & Role-Based Access Control."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=getattr(settings, "CORS_ORIGIN_REGEX", r".*"),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Standardized Custom Exception Handlers - No Internal Stack Leaks
@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status_code": exc.status_code,
            "error": exc.detail if isinstance(exc.detail, str) else "Request error",
            "message": exc.detail
        },
        headers=getattr(exc, "headers", None)
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Sanitize validation errors cleanly
    details = []
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error.get("loc", []))
        msg = error.get("msg", "Invalid value")
        details.append(f"{field}: {msg}")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "status_code": status.HTTP_422_UNPROCESSABLE_ENTITY,
            "error": "Validation Error",
            "message": "Invalid input provided.",
            "details": details
        }
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log internal error safely without exposing stack traces to client
    logger.error(f"Unhandled internal server error: {type(exc).__name__}: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
            "error": "Internal Server Error",
            "message": "An unexpected server error occurred. Please contact system administrator."
        }
    )


# Health check endpoints
@app.get("/health", tags=["System Health"])
@app.get("/api/health", tags=["System Health"])
@app.get("/api/v1/health", tags=["System Health"])
def health_check():
    db_status = "connected"
    try:
        from app.database.session import SessionLocal
        from sqlalchemy import text
        with SessionLocal() as db:
            db.execute(text("SELECT 1"))
    except Exception as e:
        logger.error(f"Database health check probe failed: {e}")
        db_status = "disconnected"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "system": "AIIA CTMS Backend",
        "database": db_status,
        "environment": getattr(settings, "ENVIRONMENT", "production"),
        "interoperability": "FHIR-Ready / CDISC-Ready",
        "compliance": "GCP-Aligned Workflow Support"
    }


# Register master API routes
app.include_router(api_router, prefix=settings.API_V1_STR)

# Static Files & SPA Fallback for unified production deployment
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="static_assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        # Prevent intercepting docs or api calls if unhandled
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            raise StarletteHTTPException(status_code=404, detail="Endpoint not found")

        file_path = os.path.join(frontend_dist, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)

        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)
        raise StarletteHTTPException(status_code=404, detail="SPA index.html not found")
