"""
Movie Synchronization Service
Handles synchronizing movie data from TMDB API to MongoDB
"""

import logging
import asyncio
from datetime import datetime
from typing import List, Dict, Any, Optional
from motor.motor_asyncio import AsyncIOMotorCollection

from .tmdb_client import TMDBClient
from ..schemas.movie import MovieCreate, MovieInDB

# Set up logger
logger = logging.getLogger(__name__)

class MovieSyncService:
    """
    Service for synchronizing movies from TMDB to MongoDB
    """

    def __init__(self,
                 tmdb_client: TMDBClient,
                 movie_collection: AsyncIOMotorCollection,
                 batch_size: int = 20,
                 delay_between_requests: float = 0.5):
        """
        Initialize the sync service

        Args:
            tmdb_client: Instance of TMDBClient for API requests
            movie_collection: MongoDB collection for movies
            batch_size: Number of movies to process in each batch
            delay_between_requests: Delay between TMDB API requests to avoid rate limiting
        """
        self.tmdb_client = tmdb_client
        self.movie_collection = movie_collection
        self.batch_size = batch_size
        self.delay = delay_between_requests

    async def _get_movie_details_with_retry(self, movie_id: int, max_retries: int = 3) -> Optional[Dict[str, Any]]:
        """
        Get movie details with retry logic

        Args:
            movie_id: TMDB movie ID
            max_retries: Maximum number of retry attempts

        Returns:
            Movie details or None if failed after retries
        """
        retries = 0
        while retries < max_retries:
            try:
                return await self.tmdb_client.get_movie_details(movie_id)
            except Exception as e:
                retries += 1
                if retries >= max_retries:
                    logger.error(f"Failed to fetch details for movie {movie_id} after {max_retries} attempts: {str(e)}")
                    return None

                # Exponential backoff
                wait_time = self.delay * (2 ** retries)
                logger.warning(f"Retrying movie {movie_id} in {wait_time:.2f}s (attempt {retries}/{max_retries})")
                await asyncio.sleep(wait_time)

    async def _process_and_save_movie(self, tmdb_movie: Dict[str, Any]) -> Optional[str]:
        """
        Process movie data and save to MongoDB

        Args:
            tmdb_movie: Movie data from TMDB

        Returns:
            MongoDB document ID or None if failed
        """
        try:
            # Convert to our schema
            movie_data = await self.tmdb_client.convert_movie_for_db(tmdb_movie)

            # Check if movie already exists in database
            existing_movie = await self.movie_collection.find_one({"tmdb_id": movie_data.tmdb_id})

            if existing_movie:
                # Update existing movie
                now = datetime.utcnow()
                update_data = movie_data.dict(exclude_unset=True)
                update_data["updated_at"] = now

                result = await self.movie_collection.update_one(
                    {"tmdb_id": movie_data.tmdb_id},
                    {"$set": update_data}
                )

                if result.modified_count > 0:
                    logger.info(f"Updated movie: {movie_data.title} (TMDB ID: {movie_data.tmdb_id})")

                return str(existing_movie["_id"])
            else:
                # Create new movie document
                now = datetime.utcnow()
                movie_db = {
                    **movie_data.dict(),
                    "created_at": now,
                    "updated_at": now,
                    "view_count": 0
                }

                result = await self.movie_collection.insert_one(movie_db)
                logger.info(f"Added new movie: {movie_data.title} (TMDB ID: {movie_data.tmdb_id})")

                return str(result.inserted_id)

        except Exception as e:
            movie_id = tmdb_movie.get("id", "unknown")
            logger.error(f"Error processing movie {movie_id}: {str(e)}")
            return None

    async def sync_movie_by_id(self, tmdb_id: int) -> Optional[str]:
        """
        Sync a single movie by TMDB ID

        Args:
            tmdb_id: TMDB movie ID

        Returns:
            MongoDB document ID or None if failed
        """
        try:
            # Get movie details from TMDB
            movie_details = await self._get_movie_details_with_retry(tmdb_id)

            if not movie_details:
                logger.error(f"Failed to get details for movie ID {tmdb_id}")
                return None

            # Process and save movie
            return await self._process_and_save_movie(movie_details)

        except Exception as e:
            logger.error(f"Error syncing movie {tmdb_id}: {str(e)}")
            return None

    async def sync_movies_from_ids(self, tmdb_ids: List[int]) -> Dict[str, Any]:
        """
        Sync multiple movies by their TMDB IDs

        Args:
            tmdb_ids: List of TMDB movie IDs

        Returns:
            Dictionary with success and failure counts
        """
        results = {
            "total": len(tmdb_ids),
            "success": 0,
            "failed": 0,
            "movie_ids": []
        }

        for tmdb_id in tmdb_ids:
            movie_id = await self.sync_movie_by_id(tmdb_id)

            if movie_id:
                results["success"] += 1
                results["movie_ids"].append(movie_id)
            else:
                results["failed"] += 1

            # Delay to avoid rate limiting
            await asyncio.sleep(self.delay)

        return results

    async def _sync_movies_from_tmdb_response(self, tmdb_response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process TMDB response and save movies to database

        Args:
            tmdb_response: Response from TMDB API containing movie list

        Returns:
            Results statistics
        """
        results = {
            "total": 0,
            "success": 0,
            "failed": 0,
            "movie_ids": []
        }

        movies = tmdb_response.get("results", [])
        results["total"] = len(movies)

        for movie in movies:
            # For list endpoints, we need to get full details
            movie_details = await self._get_movie_details_with_retry(movie["id"])

            if movie_details:
                movie_id = await self._process_and_save_movie(movie_details)

                if movie_id:
                    results["success"] += 1
                    results["movie_ids"].append(movie_id)
                else:
                    results["failed"] += 1
            else:
                results["failed"] += 1

            # Delay to avoid rate limiting
            await asyncio.sleep(self.delay)

        return results

    async def sync_popular_movies(self, pages: int = 1) -> Dict[str, Any]:
        """
        Sync popular movies from TMDB

        Args:
            pages: Number of pages to sync (20 movies per page)

        Returns:
            Results statistics
        """
        overall_results = {
            "total": 0,
            "success": 0,
            "failed": 0,
            "movie_ids": []
        }

        for page in range(1, pages + 1):
            logger.info(f"Syncing popular movies page {page}/{pages}")

            try:
                # Get popular movies for current page
                popular_movies = await self.tmdb_client.get_popular_movies(page)

                # Process and save movies
                page_results = await self._sync_movies_from_tmdb_response(popular_movies)

                # Update overall results
                overall_results["total"] += page_results["total"]
                overall_results["success"] += page_results["success"]
                overall_results["failed"] += page_results["failed"]
                overall_results["movie_ids"].extend(page_results["movie_ids"])

                logger.info(f"Completed page {page}: {page_results['success']} succeeded, {page_results['failed']} failed")

            except Exception as e:
                logger.error(f"Error processing page {page}: {str(e)}")

        return overall_results

    async def sync_top_rated_movies(self, pages: int = 1) -> Dict[str, Any]:
        """
        Sync top rated movies from TMDB

        Args:
            pages: Number of pages to sync

        Returns:
            Results statistics
        """
        overall_results = {
            "total": 0,
            "success": 0,
            "failed": 0,
            "movie_ids": []
        }

        for page in range(1, pages + 1):
            logger.info(f"Syncing top rated movies page {page}/{pages}")

            try:
                # Get top rated movies for current page
                top_rated_movies = await self.tmdb_client.get_top_rated_movies(page)

                # Process and save movies
                page_results = await self._sync_movies_from_tmdb_response(top_rated_movies)

                # Update overall results
                overall_results["total"] += page_results["total"]
                overall_results["success"] += page_results["success"]
                overall_results["failed"] += page_results["failed"]
                overall_results["movie_ids"].extend(page_results["movie_ids"])

                logger.info(f"Completed page {page}: {page_results['success']} succeeded, {page_results['failed']} failed")

            except Exception as e:
                logger.error(f"Error processing page {page}: {str(e)}")

        return overall_results

    async def sync_upcoming_movies(self, pages: int = 1) -> Dict[str, Any]:
        """
        Sync upcoming movies from TMDB

        Args:
            pages: Number of pages to sync

        Returns:
            Results statistics
        """
        overall_results = {
            "total": 0,
            "success": 0,
            "failed": 0,
            "movie_ids": []
        }

        for page in range(1, pages + 1):
            logger.info(f"Syncing upcoming movies page {page}/{pages}")

            try:
                # Get upcoming movies for current page
                upcoming_movies = await self.tmdb_client.get_upcoming_movies(page)

                # Process and save movies
                page_results = await self._sync_movies_from_tmdb_response(upcoming_movies)

                # Update overall results
                overall_results["total"] += page_results["total"]
                overall_results["success"] += page_results["success"]
                overall_results["failed"] += page_results["failed"]
                overall_results["movie_ids"].extend(page_results["movie_ids"])

                logger.info(f"Completed page {page}: {page_results['success']} succeeded, {page_results['failed']} failed")

            except Exception as e:
                logger.error(f"Error processing page {page}: {str(e)}")

        return overall_results

    async def sync_now_playing_movies(self, pages: int = 1) -> Dict[str, Any]:
        """
        Sync now playing movies from TMDB

        Args:
            pages: Number of pages to sync

        Returns:
            Results statistics
        """
        overall_results = {
            "total": 0,
            "success": 0,
            "failed": 0,
            "movie_ids": []
        }

        for page in range(1, pages + 1):
            logger.info(f"Syncing now playing movies page {page}/{pages}")

            try:
                # Get now playing movies for current page
                now_playing_movies = await self.tmdb_client.get_now_playing_movies(page)

                # Process and save movies
                page_results = await self._sync_movies_from_tmdb_response(now_playing_movies)

                # Update overall results
                overall_results["total"] += page_results["total"]
                overall_results["success"] += page_results["success"]
                overall_results["failed"] += page_results["failed"]
                overall_results["movie_ids"].extend(page_results["movie_ids"])

                logger.info(f"Completed page {page}: {page_results['success']} succeeded, {page_results['failed']} failed")

            except Exception as e:
                logger.error(f"Error processing page {page}: {str(e)}")

        return overall_results

    async def sync_movies_by_genres(self, genre_ids: List[int], pages_per_genre: int = 1) -> Dict[str, Any]:
        """
        Sync movies for specific genres

        Args:
            genre_ids: List of genre IDs to sync
            pages_per_genre: Number of pages to sync per genre

        Returns:
            Results statistics
        """
        overall_results = {
            "total": 0,
            "success": 0,
            "failed": 0,
            "movie_ids": [],
            "genres_processed": len(genre_ids)
        }

        for genre_id in genre_ids:
            logger.info(f"Syncing movies for genre ID {genre_id}")

            for page in range(1, pages_per_genre + 1):
                try:
                    # Discover movies by genre
                    discovered_movies = await self.tmdb_client.discover_movies(
                        genre_ids=[genre_id],
                        page=page
                    )

                    # Process and save movies
                    page_results = await self._sync_movies_from_tmdb_response(discovered_movies)

                    # Update overall results
                    overall_results["total"] += page_results["total"]
                    overall_results["success"] += page_results["success"]
                    overall_results["failed"] += page_results["failed"]
                    overall_results["movie_ids"].extend(page_results["movie_ids"])

                    logger.info(f"Completed genre {genre_id} page {page}: {page_results['success']} succeeded, {page_results['failed']} failed")

                except Exception as e:
                    logger.error(f"Error processing genre {genre_id} page {page}: {str(e)}")

                # Delay between pages
                await asyncio.sleep(self.delay)

            # Additional delay between genres
            await asyncio.sleep(self.delay * 2)

        return overall_results

    async def sync_all_movie_categories(self, pages_per_category: int = 2) -> Dict[str, Any]:
        """
        Sync movies from all categories (popular, top rated, upcoming, now playing)

        Args:
            pages_per_category: Number of pages to sync for each category

        Returns:
            Results statistics
        """
        overall_results = {
            "total": 0,
            "success": 0,
            "failed": 0,
            "movie_ids": [],
            "categories": {
                "popular": {"success": 0, "failed": 0},
                "top_rated": {"success": 0, "failed": 0},
                "upcoming": {"success": 0, "failed": 0},
                "now_playing": {"success": 0, "failed": 0}
            }
        }

        # Sync popular movies
        logger.info("Starting sync of popular movies")
        popular_results = await self.sync_popular_movies(pages_per_category)
        overall_results["total"] += popular_results["total"]
        overall_results["success"] += popular_results["success"]
        overall_results["failed"] += popular_results["failed"]
        overall_results["movie_ids"].extend(popular_results["movie_ids"])
        overall_results["categories"]["popular"] = {
            "success": popular_results["success"],
            "failed": popular_results["failed"]
        }

        # Sync top rated movies
        logger.info("Starting sync of top rated movies")
        top_rated_results = await self.sync_top_rated_movies(pages_per_category)
        overall_results["total"] += top_rated_results["total"]
        overall_results["success"] += top_rated_results["success"]
        overall_results["failed"] += top_rated_results["failed"]
        overall_results["movie_ids"].extend(top_rated_results["movie_ids"])
        overall_results["categories"]["top_rated"] = {
            "success": top_rated_results["success"],
            "failed": top_rated_results["failed"]
        }

        # Sync upcoming movies
        logger.info("Starting sync of upcoming movies")
        upcoming_results = await self.sync_upcoming_movies(pages_per_category)
        overall_results["total"] += upcoming_results["total"]
        overall_results["success"] += upcoming_results["success"]
        overall_results["failed"] += upcoming_results["failed"]
        overall_results["movie_ids"].extend(upcoming_results["movie_ids"])
        overall_results["categories"]["upcoming"] = {
            "success": upcoming_results["success"],
            "failed": upcoming_results["failed"]
        }

        # Sync now playing movies
        logger.info("Starting sync of now playing movies")
        now_playing_results = await self.sync_now_playing_movies(pages_per_category)
        overall_results["total"] += now_playing_results["total"]
        overall_results["success"] += now_playing_results["success"]
        overall_results["failed"] += now_playing_results["failed"]
        overall_results["movie_ids"].extend(now_playing_results["movie_ids"])
        overall_results["categories"]["now_playing"] = {
            "success": now_playing_results["success"],
            "failed": now_playing_results["failed"]
        }

        # Remove duplicates from movie_ids
        overall_results["movie_ids"] = list(set(overall_results["movie_ids"]))

        logger.info(f"Completed full sync. Total: {overall_results['total']}, " +
                  f"Success: {overall_results['success']}, Failed: {overall_results['failed']}")

        return overall_results


# Factory function to create a MovieSyncService
async def get_movie_sync_service(
    tmdb_client: TMDBClient,
    movie_collection: AsyncIOMotorCollection
) -> MovieSyncService:
    """
    Factory function to create a MovieSyncService instance

    Args:
        tmdb_client: TMDBClient instance
        movie_collection: MongoDB collection for movies

    Returns:
        Configured MovieSyncService instance
    """
    return MovieSyncService(tmdb_client, movie_collection)