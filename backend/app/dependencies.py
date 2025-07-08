"""
Dependencies module for the FastAPI application.
Defines dependency injection functions for services, database connections, and authentication.

TEMPORARILY MODIFIED FOR DEVELOPMENT: Authentication is bypassed
"""

import logging
import typing
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from datetime import datetime
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorCollection, AsyncIOMotorDatabase

from .db.database import get_database
from .crud.movie import MovieCRUD
from .crud.watch_history import WatchHistoryCRUD
from .crud.watch_later import WatchLaterCRUD
from .services.movie_service import MovieService
from .core.config import settings
from .schemas.auth import TokenPayload
from .schemas.user import UserInDB
from .services.tmdb_client import get_tmdb_client, TMDBClient
from .services.movie_sync_service import get_movie_sync_service, MovieSyncService
from .core.config import Settings

logger = logging.getLogger(__name__)

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")

# Dependency to get MovieCRUD instance
def get_movie_crud():
    """
    Dependency function to get a MovieCRUD instance with database connection.

    Returns:
        MovieCRUD instance
    """
    db = get_database()
    return MovieCRUD(db)

# Dependency to get WatchHistoryCRUD instance
def get_watch_history_crud():
    """
    Dependency function to get a WatchHistoryCRUD instance with database connection.

    Returns:
        WatchHistoryCRUD instance
    """
    db = get_database()
    return WatchHistoryCRUD(db)

# Dependency to get MovieService instance
async def get_movie_service(
    movie_crud: MovieCRUD = Depends(get_movie_crud),
    watch_history_crud: WatchHistoryCRUD = Depends(get_watch_history_crud)
):
    """
    Dependency function to get a MovieService instance with required CRUD dependencies.

    Args:
        movie_crud: MovieCRUD instance
        watch_history_crud: WatchHistoryCRUD instance

    Returns:
        MovieService instance
    """
    return MovieService(movie_crud, watch_history_crud)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Lấy thông tin user hiện tại từ JWT access token.
    - Giải mã token
    - Kiểm tra hết hạn
    - Lấy user ID (sub)
    - Truy vấn database để lấy user
    """
    import logging
    from .crud.user import get_user_by_id
    from .crud.user import db as user_crud_db
    from .crud.user import UserCRUD  # for conversion if needed
    logger = logging.getLogger(__name__)

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (JWTError, ValidationError):
        logger.exception("Token validation error")
        raise credentials_exception

    # Check expiry
    from datetime import datetime as _dt
    if token_data.exp < int(_dt.utcnow().timestamp()):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")

    user_id = token_data.sub

    # Fetch user from database
    from app.db.database import get_database
    database = get_database()
    if database is None:
        logger.error("Database connection not initialized")
        raise HTTPException(status_code=500, detail="Database connection not available")

    # Allow both ObjectId and UUID/string IDs
    try:
        from bson import ObjectId as _OID
        query_id = _OID(user_id)
        logger.info("Using ObjectId: %s", query_id)
    except Exception:
        # Not a valid ObjectId → treat as string/UUID
        query_id = user_id
        logger.info("Using string ID: %s", query_id)

    user_dict = await database.users.find_one({"_id": query_id})
    if not user_dict:
        logger.error("User not found with id: %s", query_id)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Convert Mongo document to dict suitable for UserInDB
    user_dict = dict(user_dict)
    user_dict["id"] = str(user_dict.pop("_id"))

    # Ensure hashed_password key exists for schema compliance
    if "hashed_password" not in user_dict:
        if "password" in user_dict:
            user_dict["hashed_password"] = user_dict.pop("password")
        else:
            user_dict["hashed_password"] = ""

    try:
        user_in_db = UserInDB(**user_dict)  # type: ignore
    except Exception as e:
        logger.error("Error constructing UserInDB: %s", e)
        raise credentials_exception

    return user_in_db

# Dependency to get admin user
async def get_admin_user(user: UserInDB = Depends(get_current_user)):
    """
    DEVELOPMENT MODE: This function always returns the current user as an admin

    Args:
        user: Current authenticated user

    Returns:
        UserInDB instance representing an admin user
    """
    # Development mode: Always return user as admin
    return user

    """
    # Original admin check - commented out for development
    # Check if user is an admin (placeholder logic)
    if user.email != "admin@example.com":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    return user
    """


async def get_tmdb_service() -> TMDBClient:
    """Dependency to get the TMDB client"""

    return await get_tmdb_client(Settings.TMDB_API_KEY)


async def get_movie_collection() -> AsyncIOMotorCollection:
    """Dependency to get the movies collection"""
    db = get_database()
    return db.movies

def get_movie_sync_service(
    tmdb_client: TMDBClient = Depends(get_tmdb_client),
    movie_collection: AsyncIOMotorCollection = Depends(get_movie_collection)
) -> MovieSyncService:
    """
    Create and return a MovieSyncService
    """
    # Không sử dụng await ở đây vì factory function trong movie_sync_service.py
    # đã trả về một instance của MovieSyncService trực tiếp, không phải coroutine
    return MovieSyncService(tmdb_client, movie_collection)

async def get_watch_later_crud(
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> WatchLaterCRUD:
    """
    Get WatchLaterCRUD instance.
    
    Args:
        db: MongoDB database connection
        
    Returns:
        WatchLaterCRUD instance
    """
    return WatchLaterCRUD(db)