"""
Movie CRUD operations for the FastAPI application.
Handles all database operations for movies including:
- Creating, reading, updating, and deleting movies
- Searching and filtering movies
- Managing movie view counts
"""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId

from ..db.database import get_database
from ..schemas.movie import MovieCreate, MovieUpdate, MovieInDB

logger = logging.getLogger(__name__)

class MovieCRUD:
    """CRUD class for movie operations"""
    
    def __init__(self, database):
        """
        Initialize MovieCRUD with MongoDB database connection.
        
        Args:
            database: MongoDB database connection
        """
        self.db = database
        self.collection = database.movies
    
    async def create(self, obj_in: MovieCreate) -> MovieInDB:
        """
        Create a new movie record.
        
        Args:
            obj_in: Movie data to create
            
        Returns:
            Created movie
        """
        now = datetime.utcnow()
        movie_data = obj_in.model_dump()
        movie_data.update({
            "view_count": 0,
            "created_at": now,
            "updated_at": now
        })
        
        result = await self.collection.insert_one(movie_data)
        movie_data["id"] = str(result.inserted_id)
        
        return MovieInDB(**movie_data)
    
    async def get(self, movie_id: str) -> Optional[MovieInDB]:
        """
        Get a movie by ID.
        
        Args:
            movie_id: Movie ID
            
        Returns:
            Movie if found, None otherwise
        """
        movie = await self.collection.find_one({"_id": ObjectId(movie_id)})
        if not movie:
            return None
        
        movie["id"] = str(movie.pop("_id"))
        return MovieInDB(**movie)
    
    async def get_multi(self, skip: int = 0, limit: int = 100) -> List[MovieInDB]:
        """
        Get multiple movies with pagination.
        
        Args:
            skip: Number of movies to skip
            limit: Maximum number of movies to return
            
        Returns:
            List of movies
        """
        cursor = self.collection.find().skip(skip).limit(limit)
        movies = []
        
        async for movie in cursor:
            movie["id"] = str(movie.pop("_id"))
            movies.append(MovieInDB(**movie))
        
        return movies
    
    async def get_multi_by_view_count(self, limit: int = 10) -> List[MovieInDB]:
        """
        Get movies sorted by view count.
        
        Args:
            limit: Maximum number of movies to return
            
        Returns:
            List of movies ordered by view count (descending)
        """
        cursor = self.collection.find().sort("view_count", -1).limit(limit)
        movies = []
        
        async for movie in cursor:
            movie["id"] = str(movie.pop("_id"))
            movies.append(MovieInDB(**movie))
        
        return movies
    
    async def get_featured(self, limit: int = 10) -> List[MovieInDB]:
        """
        Get featured movies.
        
        Args:
            limit: Maximum number of featured movies to return
            
        Returns:
            List of featured movies
        """
        cursor = self.collection.find({"is_featured": True}).limit(limit)
        movies = []
        
        async for movie in cursor:
            movie["id"] = str(movie.pop("_id"))
            movies.append(MovieInDB(**movie))
        
        return movies
    
    async def search(
        self, 
        query: str,
        genre: Optional[str] = None,
        year: Optional[int] = None,
        skip: int = 0, 
        limit: int = 20
    ) -> List[MovieInDB]:
        """
        Search for movies by query text and optional filters.
        
        Args:
            query: Search query for movie title or description
            genre: Optional genre filter
            year: Optional release year filter
            skip: Number of movies to skip
            limit: Maximum number of movies to return
            
        Returns:
            List of movies matching search criteria
        """
        # Build search query
        search_query = {
            "$or": [
                {"title": {"$regex": query, "$options": "i"}},
                {"description": {"$regex": query, "$options": "i"}}
            ]
        }
        
        # Add filters if provided
        if genre:
            search_query["genres"] = {"$in": [genre]}
        
        if year:
            search_query["release_year"] = year
        
        cursor = self.collection.find(search_query).skip(skip).limit(limit)
        movies = []
        
        async for movie in cursor:
            movie["id"] = str(movie.pop("_id"))
            movies.append(MovieInDB(**movie))
        
        return movies
    
    async def update(self, movie_id: str, obj_in: MovieUpdate) -> Optional[MovieInDB]:
        """
        Update a movie by ID.
        
        Args:
            movie_id: Movie ID
            obj_in: Movie data to update
            
        Returns:
            Updated movie if found, None otherwise
        """
        movie = await self.get(movie_id)
        if not movie:
            return None
        
        update_data = obj_in.model_dump(exclude_unset=True)
        if update_data:
            update_data["updated_at"] = datetime.utcnow()
            
            await self.collection.update_one(
                {"_id": ObjectId(movie_id)},
                {"$set": update_data}
            )
            
            return await self.get(movie_id)
        
        return movie
    
    async def increment_view_count(self, movie_id: str) -> Optional[MovieInDB]:
        """
        Increment the view count for a movie by ID.
        
        Args:
            movie_id: Movie ID
            
        Returns:
            Updated movie if found, None otherwise
        """
        result = await self.collection.update_one(
            {"_id": ObjectId(movie_id)},
            {
                "$inc": {"view_count": 1},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        if result.modified_count:
            return await self.get(movie_id)
        
        return None
    
    async def delete(self, movie_id: str) -> bool:
        """
        Delete a movie by ID.
        
        Args:
            movie_id: Movie ID
            
        Returns:
            True if deleted, False otherwise
        """
        result = await self.collection.delete_one({"_id": ObjectId(movie_id)})
        return result.deleted_count > 0 
    

class get_movies():
    pass
class get_movie_by_id():
    pass
class get_top_movies_by_views():
    pass
class increment_movie_view_count():
    pass
class get_related_movies():
    pass