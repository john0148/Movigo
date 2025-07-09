"""
Profile schemas for the FastAPI app.
Defines the data models for user profile-related operations including profile management,
watch history, and watch statistics.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime, date

from .user import Gender


class ProfileUpdate(BaseModel):
    """Schema for updating user profile information"""
    full_name: Optional[str] = Field(None, description="User full name")
    phone: Optional[str] = Field(None, description="User phone number")
    birth_date: Optional[date] = Field(None, description="User birth date")
    gender: Optional[Gender] = Field(None, description="User gender")


class ProfileResponse(BaseModel):
    """Schema for profile response with extended user information"""
    id: str = Field(..., description="User ID")
    email: str = Field(..., description="User email")
    full_name: Optional[str] = Field(None, description="User full name")
    phone: Optional[str] = Field(None, description="User phone number")
    avatar_url: Optional[str] = Field(None, description="URL to user avatar")
    birth_date: Optional[date] = Field(None, description="User birth date")
    gender: Optional[Gender] = Field(None, description="User gender")
    subscription_type: str = Field(..., description="User subscription type")
    max_devices: int = Field(..., description="Maximum number of devices allowed")
    created_at: datetime = Field(..., description="Timestamp when the user was created")
    
    class Config:
        from_attributes = True
        validate_by_name = True


class WatchHistoryEntry(BaseModel):
    """Schema for a single watch history entry"""
    id: str = Field(..., description="Watch history entry ID")
    user_id: str = Field(..., description="User ID")
    movie_id: str = Field(..., description="Movie ID")
    watched_at: datetime = Field(..., description="Timestamp when the movie was watched")
    watch_duration: int = Field(..., description="Duration watched in seconds")
    completed: bool = Field(default=False, description="Whether the movie was completed")
    progress_percent: float = Field(..., description="Percentage of movie watched")
    movie_details: Dict[str, Any] = Field(..., description="Basic movie details (title, poster, duration)")
    
    class Config:
        from_attributes = True
        validate_by_name = True


class WatchHistoryItem(BaseModel):
    id: str = Field(alias="_id")
    movie_id: str
    movie_title: str
    movie_poster: Optional[str] = None
    watched_at: datetime
    watch_percent: int
    completed: bool
    duration_seconds: int

    class Config:
        populate_by_name = True

class WatchHistoryResponse(BaseModel):
    items: List[WatchHistoryItem]
    total: int
    page: int
    limit: int
    has_next: bool = False
    has_prev: bool = False

    def __init__(self, **data):
        super().__init__(**data)
        self.has_next = self.page * self.limit < self.total
        self.has_prev = self.page > 1

class WatchStatsResponse(BaseModel):
    """Schema for watch statistics response"""
    total_movies: int = Field(..., description="Total number of movies watched")
    total_minutes: int = Field(..., description="Total watch time in minutes")
    favorite_genre: Optional[str] = Field(None, description="Most watched genre")
    weekly_stats: List[Dict[str, Any]] = Field(..., description="Watch statistics by week")
    monthly_stats: List[Dict[str, Any]] = Field(..., description="Watch statistics by month")
    yearly_stats: List[Dict[str, Any]] = Field(..., description="Watch statistics by year")


class WatchLaterEntry(BaseModel):
    """Schema for a single watch later entry"""
    id: str = Field(..., description="Watch later entry ID")
    user_id: str = Field(..., description="User ID")
    movie_id: str = Field(..., description="Movie ID")
    added_at: datetime = Field(..., description="Timestamp when the movie was added to watch later")
    movie_details: Dict[str, Any] = Field(..., description="Basic movie details (title, poster, duration)")
    
    class Config:
        from_attributes = True
        validate_by_name = True


class WatchLaterResponse(BaseModel):
    """Schema for paginated watch later response"""
    items: List[WatchLaterEntry] = Field(..., description="List of watch later entries")
    total: int = Field(..., description="Total number of entries")
    page: int = Field(..., description="Current page number")
    limit: int = Field(..., description="Number of items per page") 