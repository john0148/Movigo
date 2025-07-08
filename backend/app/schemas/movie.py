"""
Movie schemas for the FastAPI app. Defines the data models for movie-related operations.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, HttpUrl
from datetime import datetime


class MovieBase(BaseModel):
    """Base movie schema with common attributes"""
    title: str = Field(..., description="Movie title")
    overview: str = Field(..., description="Movie overview/description")
    release_date: str = Field(..., description="Movie release date (YYYY-MM-DD)")
    genres: List[str] = Field(default=[], description="List of movie genres")
    runtime: int = Field(..., description="Movie duration in minutes")
    vote_average: float = Field(default=0.0, description="Movie rating (0-10)")
    vote_count: int = Field(default=0, description="Number of votes")
    poster_path: Optional[str] = Field(None, description="Path to movie poster image")
    backdrop_path: Optional[str] = Field(None, description="Path to movie backdrop image")
    tmdb_id: int = Field(..., description="TMDB movie ID")


class MovieCreate(MovieBase):
    """Schema for creating a new movie"""
    is_featured: bool = Field(default=False, description="Whether the movie is featured")
    trailer_url: Optional[str] = Field(None, description="URL to movie trailer")


class MovieUpdate(BaseModel):
    """Schema for updating an existing movie (all fields optional)"""
    title: Optional[str] = None
    overview: Optional[str] = None
    release_date: Optional[str] = None
    genres: Optional[List[str]] = None
    runtime: Optional[int] = None
    vote_average: Optional[float] = None
    vote_count: Optional[int] = None
    poster_path: Optional[str] = None
    backdrop_path: Optional[str] = None
    trailer_url: Optional[str] = None
    is_featured: Optional[bool] = None


class MovieInDB(MovieBase):
    """Schema representing a movie as stored in the database"""
    id: str = Field(..., description="MongoDB document ID")
    view_count: int = Field(default=0, description="Number of times the movie has been viewed")
    created_at: datetime = Field(..., description="Timestamp when the movie was added")
    updated_at: datetime = Field(..., description="Timestamp when the movie was last updated")
    is_featured: bool = Field(default=False, description="Whether the movie is featured")
    trailer_url: Optional[str] = Field(None, description="URL to movie trailer")

    class Config:
        from_attributes = True
        validate_assignment = True  # Đã sửa validate_by_name thành validate_assignment


class MovieOut(BaseModel):
    """Schema for standard movie output"""
    id: str = Field(..., alias="_id", description="Movie ID")
    title: str = Field(..., description="Movie title")
    overview: str = Field(..., description="Movie overview/description")
    release_date: str = Field(..., description="Movie release date (YYYY-MM-DD)")
    genres: List[str] = Field(default=[], description="List of movie genres")
    runtime: int = Field(..., description="Movie duration in minutes")
    vote_average: float = Field(default=0.0, description="Movie rating (0-10)")
    vote_count: int = Field(default=0, description="Number of votes")
    poster_path: Optional[str] = Field(None, description="Path to movie poster image")
    backdrop_path: Optional[str] = Field(None, description="Path to movie backdrop image")
    tmdb_id: int = Field(..., description="TMDB movie ID")
    is_featured: bool = Field(default=False, description="Whether the movie is featured")
    trailer_url: Optional[str] = Field(None, description="URL to movie trailer")

    class Config:
        from_attributes = True
        allow_population_by_field_name = True


class MovieList(BaseModel):
    """Schema for listing multiple movies"""
    total: int = Field(..., description="Total number of movies")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Number of movies per page")
    results: List[MovieOut] = Field(..., description="List of movies")


class Genre(BaseModel):
    """Schema for movie genres"""
    id: int = Field(..., description="Genre ID")
    name: str = Field(..., description="Genre name")

class MovieResponse(MovieInDB):
    """Schema for movie responses with all fields"""
    pass

# Schema cho việc chuyển đổi dữ liệu từ TMDB sang model của chúng ta
class TMDBMovieAdapter(BaseModel):
    """Adapter for converting TMDB movie data to our schema"""
    @staticmethod
    def to_movie_create(tmdb_data: Dict[Any, Any]) -> MovieCreate:
        """Convert TMDB movie data to MovieCreate schema"""
        # Chuyển đổi danh sách genre objects thành danh sách tên
        genres = [genre["name"] for genre in tmdb_data.get("genres", [])]

        return MovieCreate(
            title=tmdb_data.get("title", ""),
            overview=tmdb_data.get("overview", ""),
            release_date=tmdb_data.get("release_date", ""),
            genres=genres,
            runtime=tmdb_data.get("runtime", 0),
            vote_average=tmdb_data.get("vote_average", 0.0),
            vote_count=tmdb_data.get("vote_count", 0),
            poster_path=tmdb_data.get("poster_path"),
            backdrop_path=tmdb_data.get("backdrop_path"),
            tmdb_id=tmdb_data.get("id", 0),
            trailer_url=None  # TMDB không trả về trailer URL trực tiếp
        )
        
        
class MovieUpdate(BaseModel):
    title: Optional[str]
    runtime: Optional[int]
    release_date: Optional[str]
