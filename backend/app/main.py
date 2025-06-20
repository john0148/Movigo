"""
Main entry point for the FastAPI application.
Initializes the FastAPI app, includes routers, and sets up middleware.
"""

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import logging
import os

from .core.config import settings
from .api import movies, auth, profiles, watch_stats, sync_routes
from .db.database import connect_to_mongodb, close_mongodb_connection, initialize_crud_modules, test_connection

# Configure logging
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Tạo thư mục uploads nếu chưa tồn tại
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.AVATAR_DIR, exist_ok=True)

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
    docs_url=f"{settings.API_V1_PREFIX}/docs" if settings.SHOW_DOCS else None,
    redoc_url=f"{settings.API_V1_PREFIX}/redoc" if settings.SHOW_DOCS else None,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files nếu có
# app.mount("/static", StaticFiles(directory="static"), name="static")

# Include routers
app.include_router(auth.router, prefix=f"{settings.API_V1_PREFIX}/auth")
app.include_router(movies.router, prefix=f"{settings.API_V1_PREFIX}/movies")
app.include_router(profiles.router, prefix=f"{settings.API_V1_PREFIX}/profiles")
app.include_router(watch_stats.router, prefix=f"{settings.API_V1_PREFIX}/watch-stats")

app.include_router(sync_routes.router, prefix=f"{settings.API_V1_PREFIX}/sync", tags=["sync"])
# Kết nối MongoDB khi startup
@app.on_event("startup")
async def startup_db_client():
    try:
        db = await connect_to_mongodb()
        if db is not None:
            initialize_crud_modules()
            logging.info("MongoDB connection successful, CRUD modules initialized")
        else:
            logging.warning("Application running without MongoDB connection! Using fallback/local data only.")
        logging.info("Application startup complete")
    except Exception as e:
        logging.error(f"Error during application startup: {e}")
        logging.warning("Application will continue without MongoDB connection - some features may not work!")

# Đóng kết nối MongoDB khi shutdown
@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongodb_connection()

@app.get("/")
async def root():
    """
    Root endpoint returning basic API information.
    """
    return {
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "description": settings.APP_DESCRIPTION,
        "docs_url": f"{settings.API_V1_PREFIX}/docs" if settings.SHOW_DOCS else None,
    }

@app.get(f"{settings.API_V1_PREFIX}/health")
async def health_check():
    """
    Health check endpoint to verify the API is running.
    """
    return {"status": "ok"}

@app.get(f"{settings.API_V1_PREFIX}/mongodb-status")
async def mongodb_status():
    """
    Check MongoDB connection status
    """
    result = await test_connection()
    return result

