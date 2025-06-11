"""
Dependencies module for the FastAPI application.
Defines dependency injection functions for services, database connections, and authentication.

TEMPORARILY MODIFIED FOR DEVELOPMENT: Authentication is bypassed
"""

import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorCollection

from .db.database import get_database
from .crud.movie import MovieCRUD
from .crud.watch_history import WatchHistoryCRUD
from .services.movie_service import MovieService
from .core.config import settings
from .schemas.auth import TokenPayload
from .schemas.user import UserInDB
from .services.tmdb_client import get_tmdb_client, TMDBClient
from .services.movie_sync_service import get_movie_sync_service, MovieSyncService

logger = logging.getLogger(__name__)

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")
TMDB_API_KEY = "12b062a4565a76aa9b24f20c65b03135"
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

# Dependency to get current user from token
async def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    DEVELOPMENT MODE: This function is temporarily modified to bypass authentication
    and always return a dummy user for development purposes.

    Args:
        token: JWT token from request (ignored in development mode)

    Returns:
        UserInDB instance representing a dummy user
    """
    # Development mode: Return dummy user without checking token
    user = {
        "id": "dummy_user_id",
        "email": "dev@example.com",
        "hashed_password": "hashed_password",
        "full_name": "Development User",
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "subscription_type": "premium"  # Premium to access all features
    }

    return UserInDB(**user)

    """
    # Original authentication logic - commented out for development
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Decode JWT token
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        # Validate token payload
        token_data = TokenPayload(**payload)

        # Check if token is expired
        if token_data.exp < datetime.utcnow().timestamp():
            raise credentials_exception

        user_id = token_data.sub

        # Get user from database (this is a placeholder, actual implementation would use a user CRUD)
        # The actual implementation would look up the user by ID in the database
        # For now, we'll return a dummy user object
        user = {
            "id": user_id,
            "email": "user@example.com",
            "hashed_password": "hashed_password",
            "full_name": "Test User",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "subscription_type": "basic"
        }

        return UserInDB(**user)

    except (JWTError, ValidationError):
        logger.exception("Token validation error")
        raise credentials_exception
    """

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

    return await get_tmdb_client(TMDB_API_KEY)


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