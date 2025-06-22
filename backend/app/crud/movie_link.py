"""
MovieLink CRUD operations for the FastAPI application.
Handles database interactions for movie-to-DriveURL mappings:
- Retrieve Google Drive streaming link by movie ID
"""

import logging
from typing import Optional
from bson import ObjectId

from ..schemas.movie_link import MovieLinkInDB

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MovieLinkCRUD:
    """CRUD class for movie link operations"""

    def __init__(self, database):
        """
        Initialize MovieLinkCRUD with MongoDB database connection.

        Args:
            database: MongoDB database connection
        """
        self.db = database
        self.collection = database.movie_link
    
    async def get_by_movie_id(self, movie_id: str) -> Optional[MovieLinkInDB]:
        logger.info(f"Finding movie link for movie_id={movie_id}")

        movie_link = await self.collection.find_one({"movie_id": movie_id})

        logger.info(f"Result of movie_link query: {movie_link}")

        if not movie_link:
            return None

        movie_link["id"] = str(movie_link.pop("_id"))
        return MovieLinkInDB(**movie_link)
