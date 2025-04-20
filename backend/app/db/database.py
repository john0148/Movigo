from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
import logging
from typing import Dict

from ..core.config import settings

# Global database instance
db: AsyncIOMotorDatabase = None

async def connect_to_mongodb():
    """
    Connect to MongoDB during application startup
    """
    try:
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        global db
        db = client[settings.MONGODB_NAME]
        logging.info(f"Connected to MongoDB ({settings.MONGODB_NAME})")
        return db
    except Exception as e:
        logging.error(f"Failed to connect to MongoDB: {e}")
        raise

async def close_mongodb_connection():
    """
    Close MongoDB connection during application shutdown
    """
    try:
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        client.close()
        logging.info("MongoDB connection closed")
    except Exception as e:
        logging.error(f"Error closing MongoDB connection: {e}")

def get_db() -> AsyncIOMotorDatabase:
    """
    Return database instance
    """
    return db

def initialize_crud_modules():
    """
    Initialize all CRUD modules with the database instance
    """
    from ..crud import movie
    from ..crud import user
    
    # Set db reference in each CRUD module
    movie.db = db
    user.db = db
