"""
API routes for synchronizing movie data from TMDB to MongoDB
"""

from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException, Query
from typing import List, Optional

from ..services.tmdb_client import TMDBClient
from ..services.movie_sync_service import MovieSyncService
from ..dependencies import get_tmdb_service, get_movie_collection, get_movie_sync_service

router = APIRouter()
# đồng bộ các phim phổ biến từ TMDB
# đồng bộ các phim đánh giá cao từ TMDB
# đồng bộ các phim sắp chiếu từ TMDB
# đồng bộ các phim đang chiếu từ TMDB
# đồng bộ một phim theo ID từ TMDB
# đồng bộ nhiều phim theo ID từ TMDB
# đồng bộ tất cả các thể loại phim từ TMDB
# đồng bộ tất cả cụ thể loại phim từ TMDB

@router.post("/popular", summary="Sync popular movies")
async def sync_popular_movies(
    background_tasks: BackgroundTasks,
    pages: int = Query(1, ge=1, le=5, description="Number of pages to sync (max 5)"),
    tmdb_client: TMDBClient = Depends(get_tmdb_service),
    sync_service: MovieSyncService = Depends(get_movie_sync_service)
):
    """
    Sync popular movies from TMDB to MongoDB.
    This is an asynchronous operation that runs in the background.
    """
    # Start sync in background
    background_tasks.add_task(sync_service.sync_popular_movies, pages)

    return {
        "status": "started",
        "message": f"Đang đồng bộ {pages} trang phim phổ biến từ TMDB",
        "pages": pages
    }

@router.post("/top-rated", summary="Sync top rated movies")
async def sync_top_rated_movies(
    background_tasks: BackgroundTasks,
    pages: int = Query(1, ge=1, le=5, description="Number of pages to sync (max 5)"),
    sync_service: MovieSyncService = Depends(get_movie_sync_service)
):
    """
    Sync top rated movies from TMDB to MongoDB.
    This is an asynchronous operation that runs in the background.
    """
    # Start sync in background
    background_tasks.add_task(sync_service.sync_top_rated_movies, pages)

    return {
        "status": "started",
        "message": f"Đang đồng bộ {pages} trang phim đánh giá cao từ TMDB",
        "pages": pages
    }

@router.post("/upcoming", summary="Sync upcoming movies")
async def sync_upcoming_movies(
    background_tasks: BackgroundTasks,
    pages: int = Query(1, ge=1, le=5, description="Number of pages to sync (max 5)"),
    sync_service: MovieSyncService = Depends(get_movie_sync_service)
):
    """
    Sync upcoming movies from TMDB to MongoDB.
    This is an asynchronous operation that runs in the background.
    """
    # Start sync in background
    background_tasks.add_task(sync_service.sync_upcoming_movies, pages)

    return {
        "status": "started",
        "message": f"Đang đồng bộ {pages} trang phim sắp chiếu từ TMDB",
        "pages": pages
    }

@router.post("/now-playing", summary="Sync now playing movies")
async def sync_now_playing_movies(
    background_tasks: BackgroundTasks,
    pages: int = Query(1, ge=1, le=5, description="Number of pages to sync (max 5)"),
    sync_service: MovieSyncService = Depends(get_movie_sync_service)
):
    """
    Sync now playing movies from TMDB to MongoDB.
    This is an asynchronous operation that runs in the background.
    """
    # Start sync in background
    background_tasks.add_task(sync_service.sync_now_playing_movies, pages)

    return {
        "status": "started",
        "message": f"Đang đồng bộ {pages} trang phim đang chiếu từ TMDB",
        "pages": pages
    }

@router.post("/movie/{tmdb_id}", summary="Sync a single movie")
async def sync_single_movie(
    tmdb_id: int,
    sync_service: MovieSyncService = Depends(get_movie_sync_service)
):
    """
    Sync a single movie by TMDB ID
    """
    movie_id = await sync_service.sync_movie_by_id(tmdb_id)

    if not movie_id:
        raise HTTPException(
            status_code=500,
            detail=f"Không thể đồng bộ phim với ID {tmdb_id}"
        )

    return {
        "status": "success",
        "message": f"Đồng bộ thành công phim với ID {tmdb_id}",
        "movie_id": movie_id
    }

@router.post("/by-ids", summary="Sync multiple movies by IDs")
async def sync_movies_by_ids(
    tmdb_ids: List[int],
    background_tasks: BackgroundTasks,
    sync_service: MovieSyncService = Depends(get_movie_sync_service)
):
    """
    Sync multiple movies by their TMDB IDs
    """
    # Start sync in background for large batches
    if len(tmdb_ids) > 5:
        background_tasks.add_task(sync_service.sync_movies_from_ids, tmdb_ids)

        return {
            "status": "started",
            "message": f"Đang đồng bộ {len(tmdb_ids)} phim theo ID từ TMDB",
            "movie_count": len(tmdb_ids)
        }
    else:
        # For small batches, do it synchronously
        results = await sync_service.sync_movies_from_ids(tmdb_ids)

        return {
            "status": "completed",
            "message": f"Đồng bộ {results['success']} phim thành công, {results['failed']} thất bại",
            "results": results
        }

@router.post("/all-categories", summary="Sync all movie categories")
async def sync_all_categories(
    background_tasks: BackgroundTasks,
    pages_per_category: int = Query(1, ge=1, le=3, description="Number of pages per category (max 3)"),
    sync_service: MovieSyncService = Depends(get_movie_sync_service)
):
    """
    Sync movies from all categories (popular, top rated, upcoming, now playing)
    """
    background_tasks.add_task(sync_service.sync_all_movie_categories, pages_per_category)

    total_pages = pages_per_category * 4  # 4 categories

    return {
        "status": "started",
        "message": f"Đang đồng bộ {total_pages} trang phim từ tất cả danh mục",
        "pages_per_category": pages_per_category,
        "total_pages": total_pages
    }

@router.post("/by-genres", summary="Sync movies by genres")
async def sync_movies_by_genres(
    background_tasks: BackgroundTasks,
    genre_ids: List[int],
    pages_per_genre: int = Query(1, ge=1, le=3, description="Number of pages per genre (max 3)"),
    sync_service: MovieSyncService = Depends(get_movie_sync_service)
):
    """
    Sync movies for specific genres
    """
    background_tasks.add_task(sync_service.sync_movies_by_genres, genre_ids, pages_per_genre)

    total_pages = pages_per_genre * len(genre_ids)

    return {
        "status": "started",
        "message": f"Đang đồng bộ {total_pages} trang phim theo {len(genre_ids)} thể loại",
        "genre_count": len(genre_ids),
        "pages_per_genre": pages_per_genre,
        "total_pages": total_pages
    }