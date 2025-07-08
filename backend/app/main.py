"""
Main entry point for the FastAPI application.
Initializes the FastAPI app, includes routers, and sets up middleware.
"""

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import logging
import os

from .core.config import settings
from .api import movies, auth, profiles, watch_stats, sync_routes, admin
from .db.database import connect_to_mongodb, close_mongodb_connection, initialize_crud_modules, test_connection
from .middleware.admin_middleware import AdminLoggingMiddleware, SecurityMiddleware

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

# Add admin security and logging middleware
app.add_middleware(AdminLoggingMiddleware)
app.add_middleware(SecurityMiddleware)

# Mount static files nếu có
# app.mount("/static", StaticFiles(directory="static"), name="static")

# Include routers
app.include_router(auth.router, prefix=f"{settings.API_V1_PREFIX}/auth")
app.include_router(movies.router, prefix=f"{settings.API_V1_PREFIX}/movies")
app.include_router(profiles.router, prefix=f"{settings.API_V1_PREFIX}/profiles")
app.include_router(watch_stats.router, prefix=f"{settings.API_V1_PREFIX}/watch-stats")
app.include_router(admin.router, prefix=f"{settings.API_V1_PREFIX}")

app.include_router(sync_routes.router, prefix=f"{settings.API_V1_PREFIX}/sync", tags=["sync"])
# Kết nối MongoDB khi startup
@app.on_event("startup")
async def startup_db_client():
    try:
        # Connect to MongoDB
        connected_db = await connect_to_mongodb()
        
        if connected_db is not None:
            # Check global db variable from database module
            from .db.database import db as global_db
            logging.info(f"🔍 Local db: {connected_db}")
            logging.info(f"🔍 Global db: {global_db}")
            
            # Initialize CRUD modules
            initialize_crud_modules()
            
            # Verify CRUD module db connection
            from .crud.user import db as user_crud_db
            logging.info(f"🔍 User CRUD db: {user_crud_db}")
            
            if user_crud_db is not None:
                logging.info("✅ MongoDB connection successful, CRUD modules initialized")
            else:
                logging.error("❌ CRUD modules not properly initialized - db is None!")
        else:
            logging.warning("⚠️ Application running without MongoDB connection! Using fallback/local data only.")
            
        logging.info("🚀 Application startup complete")
        
    except Exception as e:
        logging.error(f"❌ Error during application startup: {e}")
        logging.warning("⚠️ Application will continue without MongoDB connection - some features may not work!")

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

@app.get(f"{settings.API_V1_PREFIX}/debug/db-connections")
async def debug_db_connections():
    """
    Debug endpoint to check all database connection references
    """
    try:
        from .db.database import db as global_db, client as global_client
        from .crud.user import db as user_crud_db
        from .crud.movie import db as movie_crud_db
        
        result = {
            "timestamp": logging.Formatter().formatTime(logging.LogRecord("", 0, "", 0, "", (), None)),
            "global_db": str(global_db),
            "global_client": str(global_client),
            "user_crud_db": str(user_crud_db),
            "movie_crud_db": str(movie_crud_db),
            "connections_match": global_db == user_crud_db == movie_crud_db,
            "global_db_is_none": global_db is None,
            "user_crud_db_is_none": user_crud_db is None
        }
        
        # Test a simple operation if db is available
        if user_crud_db is not None:
            try:
                collection_names = await user_crud_db.list_collection_names()
                result["collections_accessible"] = True
                result["available_collections"] = collection_names
                
                # Test user collection access
                if "users" in collection_names:
                    users_count = await user_crud_db.users.count_documents({})
                    result["users_count"] = users_count
                    result["users_collection_accessible"] = True
                else:
                    result["users_collection_accessible"] = False
                    result["error"] = "Users collection not found"
                    
            except Exception as e:
                result["collections_accessible"] = False
                result["error"] = str(e)
        else:
            result["collections_accessible"] = False
            result["error"] = "No database connection"
            
        return result
        
    except Exception as e:
        return {
            "error": f"Debug endpoint error: {str(e)}",
            "timestamp": logging.Formatter().formatTime(logging.LogRecord("", 0, "", 0, "", (), None))
        }

