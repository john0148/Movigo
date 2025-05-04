"""
Dependencies module for the FastAPI application.
Defines dependency injection functions for services, database connections, and authentication.
"""

import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from datetime import datetime

from .db.database import get_database
from .crud.movie import MovieCRUD
from .crud.watch_history import WatchHistoryCRUD
from .services.movie_service import MovieService
from .core.config import settings
from .schemas.auth import TokenPayload
from .schemas.user import UserInDB

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

# Dependency to get current user from token
async def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Dependency function to get the current authenticated user from the token.
    
    Args:
        token: JWT token from request
        
    Returns:
        UserInDB instance representing the current user
        
    Raises:
        HTTPException: If the token is invalid or the user is not found
    """
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

# Dependency to get admin user
async def get_admin_user(user: UserInDB = Depends(get_current_user)):
    """
    Dependency function to get an admin user.
    
    Args:
        user: Current authenticated user
        
    Returns:
        UserInDB instance representing an admin user
        
    Raises:
        HTTPException: If the user is not an admin
    """
    # Check if user is an admin (placeholder logic)
    if user.email != "admin@example.com":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    return user
