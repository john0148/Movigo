"""
Movie schemas for the FastAPI app.
Defines the data models for movie-related operations.
"""

from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class MovieBase(BaseModel):
    """Base movie schema with common attributes"""
    title: str = Field(..., description="Movie title")
    description: str = Field(..., description="Movie description")
    release_year: int = Field(..., description="Year the movie was released")
    genres: List[str] = Field(default=[], description="List of movie genres")
    duration_minutes: int = Field(..., description="Movie duration in minutes")
    rating: float = Field(default=0.0, description="Movie rating (0-10)")
    poster_url: str = Field(..., description="URL to movie poster image")
    backdrop_url: Optional[str] = Field(None, description="URL to movie backdrop image")
    trailer_url: Optional[str] = Field(None, description="URL to movie trailer")


class MovieCreate(MovieBase):
    """Schema for creating a new movie"""
    # Additional fields for creation only
    is_featured: bool = Field(default=False, description="Whether the movie is featured")

class MovieOut(BaseModel):
    pass
class MovieList():
    pass

class MovieUpdate(BaseModel):
    """Schema for updating an existing movie (all fields optional)"""
    title: Optional[str] = None
    description: Optional[str] = None
    release_year: Optional[int] = None
    genres: Optional[List[str]] = None
    duration_minutes: Optional[int] = None
    rating: Optional[float] = None
    poster_url: Optional[str] = None
    backdrop_url: Optional[str] = None
    trailer_url: Optional[str] = None
    is_featured: Optional[bool] = None


class MovieInDB(MovieBase):
    """Schema representing a movie as stored in the database"""
    id: str = Field(..., description="Movie ID")
    view_count: int = Field(default=0, description="Number of times the movie has been viewed")
    created_at: datetime = Field(..., description="Timestamp when the movie was added")
    updated_at: datetime = Field(..., description="Timestamp when the movie was last updated")
    is_featured: bool = Field(default=False, description="Whether the movie is featured")

    class Config:
        from_attributes = True
        populate_by_name = True


class MovieResponse(MovieInDB):
    """Schema for movie responses with all fields"""
    pass
