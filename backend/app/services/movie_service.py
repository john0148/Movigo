"""
Movie service for the FastAPI application.
Handles business logic for movie-related operations including:
- Movie listing, filtering and search
- Getting movie details
- Tracking movie views
- Managing featured movies
"""

import logging
from typing import List, Optional
import random
from datetime import datetime

from ..crud.movie import MovieCRUD
from ..crud.watch_history import WatchHistoryCRUD
from ..schemas.movie import MovieInDB, MovieResponse

logger = logging.getLogger(__name__)

class MovieService:
    """Service class for movie-related operations"""
    
    def __init__(self, movie_crud: MovieCRUD, watch_history_crud: WatchHistoryCRUD):
        """
        Initialize MovieService with required dependencies.
        
        Args:
            movie_crud: MovieCRUD instance for database operations
            watch_history_crud: WatchHistoryCRUD instance for tracking watch history
        """
        self.movie_crud = movie_crud
        self.watch_history_crud = watch_history_crud
    
    async def get_movies(self, skip: int = 0, limit: int = 20) -> List[MovieResponse]:
        """
        Get a paginated list of movies.
        
        Args:
            skip: Number of movies to skip
            limit: Maximum number of movies to return
            
        Returns:
            List of movies
        """
        movies = await self.movie_crud.get_multi(skip=skip, limit=limit)
        return [MovieResponse.model_validate(movie) for movie in movies]
    
    async def get_random_movies(self, limit: int = 10) -> List[MovieResponse]:
        """
        Get a list of random movies.
        
        Args:
            limit: Number of random movies to return
            
        Returns:
            List of random movies
        """
        # Get a larger pool of movies and then randomly select from them
        pool_size = min(limit * 3, 100)  # Get a reasonable pool size
        all_movies = await self.movie_crud.get_multi(limit=pool_size)
        
        # Randomly select 'limit' movies from the pool
        selected_movies = random.sample(all_movies, min(limit, len(all_movies)))
        return [MovieResponse.model_validate(movie) for movie in selected_movies]
    
    async def get_most_viewed_movies(self, limit: int = 10) -> List[MovieResponse]:
        """
        Get a list of most viewed movies sorted by view count.
        
        Args:
            limit: Number of most viewed movies to return
            
        Returns:
            List of most viewed movies
        """
        movies = await self.movie_crud.get_multi_by_view_count(limit=limit)
        return [MovieResponse.model_validate(movie) for movie in movies]
    
    async def get_featured_movies(self, limit: int = 10) -> List[MovieResponse]:
        """
        Get a list of featured movies.
        
        Args:
            limit: Number of featured movies to return
            
        Returns:
            List of featured movies
        """
        movies = await self.movie_crud.get_featured(limit=limit)
        return [MovieResponse.model_validate(movie) for movie in movies]
    
    async def search_movies(
        self, 
        query: str,
        genre: Optional[str] = None,
        year: Optional[int] = None,
        skip: int = 0, 
        limit: int = 20
    ) -> List[MovieResponse]:
        """
        Search for movies by title, description, or other criteria.
        
        Args:
            query: Search query string
            genre: Optional genre filter
            year: Optional release year filter
            skip: Number of movies to skip
            limit: Maximum number of movies to return
            
        Returns:
            List of movies matching search criteria
        """
        movies = await self.movie_crud.search(
            query=query,
            genre=genre,
            year=year,
            skip=skip,
            limit=limit
        )
        return [MovieResponse.model_validate(movie) for movie in movies]
    
    async def get_movie(self, movie_id: str) -> Optional[MovieResponse]:
        """
        Get a specific movie by ID.
        
        Args:
            movie_id: Movie ID
            
        Returns:
            Movie details or None if not found
        """
        movie = await self.movie_crud.get(movie_id)
        if not movie:
            return None
        return MovieResponse.model_validate(movie)
    
    async def increment_view_count(self, movie_id: str, user_id: str) -> Optional[MovieResponse]:
        """
        Increment the view count for a specific movie and record in user's watch history.
        
        Args:
            movie_id: Movie ID
            user_id: User ID
            
        Returns:
            Updated movie details or None if movie not found
        """
        # First, get the movie to ensure it exists and to have its details
        movie = await self.movie_crud.get(movie_id)
        if not movie:
            return None
        
        # Increment view count
        updated_movie = await self.movie_crud.increment_view_count(movie_id)
        
        # Record watch history (create or update)
        now = datetime.utcnow()
        watch_history_data = {
            "user_id": user_id,
            "movie_id": movie_id,
            "watched_at": now,
            "movie_details": {
                "title": movie.title,
                "poster_url": movie.poster_url,
                "duration_minutes": movie.duration_minutes
            }
        }
        
        # Try to find existing watch history for this movie
        existing_entry = await self.watch_history_crud.get_by_user_and_movie(user_id, movie_id)
        
        if existing_entry:
            # Update existing entry
            await self.watch_history_crud.update(
                entry_id=existing_entry.id,
                obj_in=watch_history_data
            )
        else:
            # Create new entry
            await self.watch_history_crud.create(obj_in=watch_history_data)
        
        return MovieResponse.model_validate(updated_movie) 