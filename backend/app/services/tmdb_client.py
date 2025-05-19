
# Chi tiết phim
# Phim phổ biến
# Phim đánh giá cao
# Phim sắp chiếu
# Phim đang chiếu
# Tìm kiếm phim
# Khám phá phim theo các tiêu chí
# services/tmdb_client.py
import httpx
import logging
from typing import Dict, List, Optional, Union, Any
from urllib.parse import urljoin
from fastapi import HTTPException
from datetime import datetime
from pydantic import BaseModel
from ..schemas.movie import TMDBMovieAdapter, MovieCreate

logger = logging.getLogger(__name__)

class TMDBConfig(BaseModel):
    """Configuration for TMDB API"""
    api_key: str
    base_url: str = "https://api.themoviedb.org/3"
    image_base_url: str = "https://image.tmdb.org/t/p/"
    language: str = "vi-VN"
    include_adult: bool = False
    timeout: int = 30  # seconds

class TMDBClient:
    """
    Client for The Movie Database API

    Provides methods to fetch movie data from TMDB API
    and transform it to match our application schemas.
    """

    def __init__(self, config: TMDBConfig):
        """Initialize with TMDB API configuration"""
        self.config = config
        self.default_params = {
            "api_key": self.config.api_key,
            "language": self.config.language,
            "include_adult": str(self.config.include_adult).lower()
        }
        self.headers = {
            "Accept": "application/json",
            "Content-Type": "application/json"
        }

    async def _make_request(
        self,
        endpoint: str,
        method: str = "GET",
        params: Optional[Dict[str, Any]] = None,
        data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Make a request to the TMDB API

        Args:
            endpoint: API endpoint path
            method: HTTP method (GET, POST, etc.)
            params: URL parameters
            data: Request body data

        Returns:
            API response as dictionary

        Raises:
            HTTPException: If API request fails
        """
        #endpoint = endpoint.lstrip("/")  # Remove leading slash if present
        #url = urljoin(self.config.base_url, endpoint)
        url = f"{self.config.base_url}{endpoint}"
        # Merge default params with request params
        request_params = {**self.default_params}
        if params:
            request_params.update(params)

        try:
            async with httpx.AsyncClient(timeout=self.config.timeout) as client:
                if method.upper() == "GET":
                    response = await client.get(
                        url,
                        params=request_params,
                        headers=self.headers
                    )
                elif method.upper() == "POST":
                    response = await client.post(
                        url,
                        params=request_params,
                        json=data,
                        headers=self.headers
                    )
                else:
                    raise ValueError(f"Unsupported HTTP method: {method}")

                response.raise_for_status()
                return response.json()

        except httpx.TimeoutException:
            logger.error(f"Timeout while accessing TMDB API: {url}")
            raise HTTPException(
                status_code=504,
                detail="Timeout while accessing TMDB API"
            )
        except httpx.HTTPStatusError as e:
            logger.error(f"TMDB API error: {e.response.status_code} - {e.response.text}")
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"TMDB API error: {e.response.text}"
            )
        except Exception as e:
            logger.error(f"Unexpected error while accessing TMDB API: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Không thể kết nối đến máy chủ TMDB, vui lòng kiểm tra kết nối mạng: {str(e)}"
            )

    async def get_movie_details(self, movie_id: int) -> Dict[str, Any]:
        """
        Get details for a specific movie

        Args:
            movie_id: TMDB movie ID

        Returns:
            Movie details
        """
        endpoint = f"/movie/{movie_id}"
        params = {"append_to_response": "videos,credits"}
        return await self._make_request(endpoint, params=params)

    async def get_popular_movies(self, page: int = 1) -> Dict[str, Any]:
        """
        Get popular movies

        Args:
            page: Page number for pagination

        Returns:
            List of popular movies
        """
        endpoint = "/movie/popular"
        params = {"page": str(page)}
        return await self._make_request(endpoint, params=params)

    async def get_top_rated_movies(self, page: int = 1) -> Dict[str, Any]:
        """
        Get top rated movies

        Args:
            page: Page number for pagination

        Returns:
            List of top rated movies
        """
        endpoint = "/movie/top_rated"
        params = {"page": str(page)}
        return await self._make_request(endpoint, params=params)

    async def get_upcoming_movies(self, page: int = 1) -> Dict[str, Any]:
        """
        Get upcoming movies

        Args:
            page: Page number for pagination

        Returns:
            List of upcoming movies
        """
        endpoint = "/movie/upcoming"
        params = {"page": str(page)}
        return await self._make_request(endpoint, params=params)

    async def get_now_playing_movies(self, page: int = 1) -> Dict[str, Any]:
        """
        Get movies currently playing in theaters

        Args:
            page: Page number for pagination

        Returns:
            List of now playing movies
        """
        endpoint = "/movie/now_playing"
        params = {"page": str(page)}
        return await self._make_request(endpoint, params=params)

    async def search_movies(self, query: str, page: int = 1) -> Dict[str, Any]:
        """
        Search for movies

        Args:
            query: Search query string
            page: Page number for pagination

        Returns:
            Search results
        """
        endpoint = "/search/movie"
        params = {
            "query": query,
            "page": str(page)
        }
        return await self._make_request(endpoint, params=params)

    async def get_movie_videos(self, movie_id: int) -> List[Dict[str, Any]]:
        """
        Get videos for a specific movie

        Args:
            movie_id: TMDB movie ID

        Returns:
            List of videos
        """
        endpoint = f"/movie/{movie_id}/videos"
        response = await self._make_request(endpoint)
        return response.get("results", [])

    async def get_movie_credits(self, movie_id: int) -> Dict[str, Any]:
        """
        Get credits (cast and crew) for a specific movie

        Args:
            movie_id: TMDB movie ID

        Returns:
            Movie credits
        """
        endpoint = f"/movie/{movie_id}/credits"
        return await self._make_request(endpoint)

    async def get_movie_recommendations(self, movie_id: int, page: int = 1) -> Dict[str, Any]:
        """
        Get movie recommendations for a specific movie

        Args:
            movie_id: TMDB movie ID
            page: Page number for pagination

        Returns:
            List of recommended movies
        """
        endpoint = f"/movie/{movie_id}/recommendations"
        params = {"page": str(page)}
        return await self._make_request(endpoint, params=params)

    async def get_movie_genres(self) -> List[Dict[str, Any]]:
        """
        Get list of movie genres

        Returns:
            List of genres
        """
        endpoint = "/genre/movie/list"
        response = await self._make_request(endpoint)
        return response.get("genres", [])

    async def discover_movies(
        self,
        genre_ids: Optional[List[int]] = None,
        sort_by: str = "popularity.desc",
        page: int = 1,
        year: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Discover movies based on filters

        Args:
            genre_ids: List of genre IDs to include
            sort_by: Sort order (e.g. popularity.desc, vote_average.desc)
            page: Page number for pagination
            year: Release year to filter by

        Returns:
            List of discovered movies
        """
        endpoint = "/discover/movie"
        params = {
            "sort_by": sort_by,
            "page": str(page)
        }

        if genre_ids:
            params["with_genres"] = ",".join(str(id) for id in genre_ids)

        if year:
            params["primary_release_year"] = str(year)

        return await self._make_request(endpoint, params=params)

    def get_complete_image_url(self, path: Optional[str], size: str = "w500") -> Optional[str]:
        """
        Get complete image URL for a poster or backdrop path

        Args:
            path: Image path from TMDB
            size: Image size (w500, original, etc.)

        Returns:
            Complete image URL or None if path is None
        """
        if not path:
            return None

        return f"{self.config.image_base_url}{size}{path}"

    async def get_trailer_url(self, movie_id: int) -> Optional[str]:
        """
        Get YouTube trailer URL for a movie

        Args:
            movie_id: TMDB movie ID

        Returns:
            YouTube URL or None if no trailer found
        """
        videos = await self.get_movie_videos(movie_id)

        # First try to find official trailers
        trailers = [
            video for video in videos
            if video.get("type") == "Trailer" and
            video.get("site") == "YouTube" and
            video.get("official") == True
        ]

        # If no official trailers, look for any trailer
        if not trailers:
            trailers = [
                video for video in videos
                if video.get("type") == "Trailer" and
                video.get("site") == "YouTube"
            ]

        # If still no trailers, look for any video
        if not trailers:
            trailers = [
                video for video in videos
                if video.get("site") == "YouTube"
            ]

        if trailers:
            return f"https://www.youtube.com/watch?v={trailers[0].get('key')}"

        return None

    async def convert_movie_for_db(self, tmdb_movie: Dict[str, Any]) -> MovieCreate:
        """
        Convert TMDB movie format to our database format

        Args:
            tmdb_movie: Movie data from TMDB API

        Returns:
            MovieCreate object ready for database insertion
        """
        # Convert from TMDB data to our schema
        movie_data = TMDBMovieAdapter.to_movie_create(tmdb_movie)

        # Try to get trailer URL
        if tmdb_movie.get("id"):
            movie_data.trailer_url = await self.get_trailer_url(tmdb_movie["id"])

        return movie_data


# Create function to initialize the client
async def get_tmdb_client(api_key: str) -> TMDBClient:
    """
    Factory function to create a TMDBClient instance

    Args:
        api_key: TMDB API key

    Returns:
        Configured TMDBClient instance
    """
    config = TMDBConfig(api_key=api_key)
    return TMDBClient(config)