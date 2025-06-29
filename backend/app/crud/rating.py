"""
Rating CRUD operations for the FastAPI application.
Handles database interactions for movie ratings:
- Retrieve ratings by movie ID
- Create new rating for a movie
"""

import logging
from typing import List
from datetime import datetime

from ..schemas.rating import RatingOut, RatingCreate

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RatingCRUD:
    """CRUD class for rating operations"""

    def __init__(self, database):
        """
        Initialize RatingCRUD with MongoDB database connection.

        Args:
            database: MongoDB database connection
        """
        self.db = database
        self.collection = database.rating

    async def get_by_movie_id(self, movie_id: str) -> List[RatingOut]:
        logger.info(f"Finding ratings for movie_id={movie_id}")

        cursor = self.collection.find({"movie_id": movie_id}).sort("created_at", -1)
        ratings = await cursor.to_list(length=100)

        logger.info(f"Found {len(ratings)} ratings")

        for rating in ratings:
            rating["id"] = str(rating.pop("_id"))

        return [RatingOut(**rating) for rating in ratings]

    async def create(self, movie_id: str, rating_data: RatingCreate) -> RatingOut:
        logger.info(f"Creating rating for movie_id={movie_id}")

        doc = rating_data.dict()
        doc["movie_id"] = movie_id
        doc["created_at"] = datetime.utcnow()

        result = await self.collection.insert_one(doc)
        logger.info(f"Inserted rating with _id={result.inserted_id}")

        doc["id"] = str(result.inserted_id)
        return RatingOut(**doc)
