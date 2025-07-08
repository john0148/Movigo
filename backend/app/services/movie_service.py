"""
Movie service for the FastAPI application.
Handles business logic for movie-related operations including:
- Movie listing, filtering and search
- Getting movie details
- Tracking movie views
- Managing featured movies
"""

# lấy số lương phim với phân trang
# lấy phim ngẫu nhiên
# lấy phim được xem nhiều nhất
# ds phim nổi bật
# tim kiếm phim(theo tên, thể loại, năm phát hành)
#
# lấy phim theo id
# tăng view count cho phim lưu lại lich sử xem của người dùng
import logging
from typing import List, Optional
import random
from datetime import datetime

from ..crud.movie import MovieCRUD
from ..crud.watch_history import WatchHistoryCRUD
from ..schemas.movie import MovieInDB, MovieResponse
from ..crud.watch_later import WatchLaterCRUD


logger = logging.getLogger(__name__)

class MovieService:
    """Service class for movie-related operations"""

    def __init__(self, movie_crud: MovieCRUD, watch_history_crud: WatchHistoryCRUD, watch_later_crud: WatchLaterCRUD):
        """
        Initialize MovieService with required dependencies.

        Args:
            movie_crud: MovieCRUD instance for database operations
            watch_history_crud: WatchHistoryCRUD instance for tracking watch history
        """
        self.movie_crud = movie_crud
        self.watch_history_crud = watch_history_crud,
        self.watch_later_crud = watch_later_crud

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
    
    async def add_to_watch_later(self, user_id: str, movie_id: str) -> bool:
        """
        Thêm phim vào danh sách 'xem sau'. Trả về True nếu thành công, False nếu đã có.
        """
        existing = await self.watch_later_crud.get_by_user_and_movie(user_id, movie_id)
        if existing:
            return False

        movie = await self.movie_crud.get(movie_id)
        if not movie:
            return False

        await self.watch_later_crud.create({
            "user_id": user_id,
            "movie_id": movie_id,
            "movie": {
                "title": movie.title,
                "poster_url": movie.poster_path, 
            },
            "added_date": datetime.utcnow(),
        })
        return True
        
    # Lấy danh sách xem sau
    async def get_watch_later_movies(self, user_id: str) -> List[MovieResponse]:
        entries = await self.watch_later_crud.get_user_list(user_id)
        movie_ids = [entry.movie_id for entry in entries]
        movies = await self.movie_crud.get_by_ids(movie_ids)
        return [MovieResponse.model_validate(movie) for movie in movies]

    # Kiểm tra phim đã trong danh sách
    async def is_in_watch_later(self, user_id: str, movie_id: str) -> bool:
        existing = await self.watch_later_crud.get_by_user_and_movie(user_id, movie_id)
        return existing is not None

    # Xóa khỏi danh sách
    async def remove_from_watch_later(self, user_id: str, movie_id: str) -> bool:
        entry = await self.watch_later_crud.get_by_user_and_movie(user_id, movie_id)
        if entry:
            return await self.watch_later_crud.delete(entry.id)
        return False
    
    async def update_movie(self, movie_id: str, data: dict):
        return await self.movie_crud.update(movie_id, data)

