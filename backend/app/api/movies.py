from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from bson import ObjectId
import logging
from fastapi.responses import StreamingResponse
import httpx

from ..db.models.movie import MovieModel
from ..crud.movie import (
    get_movies,
    get_movie_by_id,
    get_top_movies_by_views,
    increment_movie_view_count,
    get_related_movies,
    )
from ..crud.movie_link import MovieLinkCRUD
from ..crud.rating import RatingCRUD
from ..crud.character import CharacterCRUD
from ..crud.comment import CommentCRUD
from ..schemas.movie import MovieOut, MovieList, MovieResponse
from ..schemas.rating import RatingOut, RatingCreate
from ..schemas.character import CharacterInDB
from ..schemas.comment import CommentResponse
from ..schemas.comment import CommentCreate
from ..core.security import get_current_user
from ..services.movie_service import MovieService
from ..dependencies import get_movie_service
from ..schemas.user import UserInDB
from ..schemas.movie_link import MovieLinkBase, MovieLinkInDB, MovieLinkResponse
from ..db.database import get_database


"""
Movies API Router
Xử lý các endpoints liên quan đến phim:
- Lấy danh sách phim (random, theo category)
- Lấy chi tiết phim
- Lấy danh sách phim xem nhiều nhất
- Cập nhật lượt xem phim
- Lấy phim liên quan
"""

router = APIRouter(tags=["movies"])
logger = logging.getLogger(__name__)

@router.get("/", response_model=List[MovieResponse])
async def get_movies(
    skip: int = Query(0, description="Number of movies to skip"),
    limit: int = Query(20, description="Number of movies to return"),
    movie_service: MovieService = Depends(get_movie_service)
):
    """
    Get a paginated list of movies.

    Args:
        skip: Number of movies to skip for pagination
        limit: Maximum number of movies to return
        movie_service: MovieService dependency

    Returns:
        List of movies
    """
    logger.info(f"Getting movies with skip={skip}, limit={limit}")
    return await movie_service.get_movies(skip=skip, limit=limit)

@router.get("/random", response_model=List[MovieResponse])
async def get_random_movies(
    limit: int = Query(10, description="Number of random movies to return"),
    movie_service: MovieService = Depends(get_movie_service)
):
    """
    Get a list of random movies.

    Args:
        limit: Number of random movies to return
        movie_service: MovieService dependency

    Returns:
        List of random movies
    """
    logger.info(f"Getting {limit} random movies")
    return await movie_service.get_random_movies(limit=limit)

@router.get("/most-viewed", response_model=List[MovieResponse])
async def get_most_viewed_movies(
    limit: int = Query(10, description="Number of most viewed movies to return"),
    movie_service: MovieService = Depends(get_movie_service)
):
    """
    Get a list of most viewed movies.

    Args:
        limit: Number of most viewed movies to return
        movie_service: MovieService dependency

    Returns:
        List of most viewed movies sorted by view count
    """
    logger.info(f"Getting {limit} most viewed movies")
    return await movie_service.get_most_viewed_movies(limit=limit)

@router.get("/featured", response_model=List[MovieResponse])
async def get_featured_movies(
    limit: int = Query(10, description="Number of featured movies to return"),
    movie_service: MovieService = Depends(get_movie_service)
):
    """
    Get a list of featured movies.

    Args:
        limit: Number of featured movies to return
        movie_service: MovieService dependency

    Returns:
        List of featured movies
    """
    logger.info(f"Getting {limit} featured movies")
    return await movie_service.get_featured_movies(limit=limit)


@router.get("/search", response_model=List[MovieResponse])
async def search_movies(
    query: str = Query(None, description="Search query"),
    genre: Optional[str] = Query(None, description="Filter by genre"),
    year: Optional[int] = Query(None, description="Filter by release year"),
    skip: int = Query(0, description="Number of movies to skip"),
    limit: int = Query(20, description="Number of movies to return"),
    movie_service: MovieService = Depends(get_movie_service)
):
    """
    Search for movies by title, description, or other criteria.

    Args:
        query: Search query string
        genre: Optional genre filter
        year: Optional release year filter
        skip: Number of movies to skip
        limit: Maximum number of movies to return
        movie_service: MovieService dependency

    Returns:
        List of movies matching search criteria
    """
    logger.info(f"Searching movies with query='{query}', genre={genre}, year={year}")
    return await movie_service.search_movies(
        query=query,
        genre=genre,
        year=year,
        skip=skip,
        limit=limit
    )

@router.get("/{movie_id}", response_model=MovieResponse)
async def get_movie(
    movie_id: str = Path(..., description="The ID of the movie to get"),
    movie_service: MovieService = Depends(get_movie_service)
):
    """
    Get a specific movie by ID.

    Args:
        movie_id: Movie ID
        movie_service: MovieService dependency

    Returns:
        Movie details

    Raises:
        HTTPException: If the movie is not found
    """
    logger.info(f"Getting movie with id={movie_id}")
    movie = await movie_service.get_movie(movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    return movie

@router.post("/{movie_id}/view", response_model=MovieResponse)
async def increment_view_count(
    movie_id: str = Path(..., description="The ID of the movie to increment view count"),
    user: UserInDB = Depends(get_current_user),
    movie_service: MovieService = Depends(get_movie_service)
):
    """
    Increment the view count for a specific movie and record in user's watch history.

    Args:
        movie_id: Movie ID
        user: Current authenticated user
        movie_service: MovieService dependency

    Returns:
        Updated movie details

    Raises:
        HTTPException: If the movie is not found
    """
    logger.info(f"Incrementing view count for movie id={movie_id}, user={user.email}")
    movie = await movie_service.increment_view_count(movie_id, user.id)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    return movie

@router.get("/top", response_model=List[MovieOut])
async def read_top_movies(
    limit: int = Query(10, ge=1, le=50, description="Số lượng phim trả về"),
    period: str = Query("week", description="Khoảng thời gian (week, month, year, all)")
):
    """
    Lấy danh sách phim được xem nhiều nhất
    - period: week, month, year, all
    """
    movies = await get_top_movies_by_views(limit, period)
    return movies

@router.get("/{movie_id}/related", response_model=List[MovieOut])
async def read_related_movies(
    movie_id: str = Path(..., description="ID của phim"),
    limit: int = Query(6, ge=1, le=20, description="Số lượng phim liên quan trả về")
):
    """
    Lấy danh sách phim liên quan
    - Dựa trên thể loại của phim hiện tại
    """
    movie = await get_movie_by_id(ObjectId(movie_id))
    if not movie:
        raise HTTPException(status_code=404, detail="Phim không tồn tại")

    related = await get_related_movies(movie, limit)
    return related

@router.get("/{movie_id}/drive-url", response_model=MovieLinkResponse)
async def get_drive_link(movie_id: str, db=Depends(get_database)):
    movie_link_crud = MovieLinkCRUD(db)
    movie_link = await movie_link_crud.get_by_movie_id(movie_id)

    if not movie_link:
        raise HTTPException(status_code=404, detail="Drive link not found")

    return movie_link
@router.get("/{movie_id}/comment", response_model=List[CommentResponse])
async def get_comments_by_movie_id(movie_id: str, db=Depends(get_database)):
    comment_crud = CommentCRUD(db)
    return await comment_crud.get_by_movie_id(movie_id)

@router.post("/{movie_id}/comment", response_model=CommentResponse)
async def post_comment(movie_id: str, comment: CommentCreate, db=Depends(get_database)):
    crud = CommentCRUD(db)
    return await crud.add_comment(comment)

@router.get("/{movie_id}/ratings", response_model=list[RatingOut])
async def get_ratings(movie_id: str, db=Depends(get_database)):
    rating_crud = RatingCRUD(db)
    ratings = await rating_crud.get_by_movie_id(movie_id)
    return ratings

@router.post("/{movie_id}/ratings", response_model=RatingOut)
async def create_rating(movie_id: str, rating: RatingCreate, db=Depends(get_database)):
    rating_crud = RatingCRUD(db)
    rating_out = await rating_crud.create(movie_id, rating)
    return rating_out

@router.get("/{movie_id}/characters", response_model=List[CharacterInDB])
async def get_characters(movie_id: str, db=Depends(get_database)):
    character_crud = CharacterCRUD(db)
    characters = await character_crud.get_by_movie_id(movie_id)
    return characters


