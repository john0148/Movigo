from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, core_schema, handler):
        """Customize schema for OpenAPI/JSON Schema output."""
        schema = handler(core_schema)
        schema.update(type="string")
        return schema

class MovieModel(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    title: str = Field(..., description="Movie title")
    overview: str = Field(..., description="Movie overview/description")
    poster_url: str = Field(..., description="URL to movie poster")
    backdrop_url: Optional[str] = Field(None, description="URL to movie backdrop")
    genres: List[str] = Field(..., description="List of movie genres")
    release_date: datetime = Field(..., description="Release date of the movie")
    runtime: int = Field(..., description="Movie duration in minutes")
    video_url: str = Field(..., description="URL to movie video")
    view_count: int = Field(default=0, description="Number of views")
    rating: Optional[float] = Field(None, description="Average rating")
    created_at: datetime = Field(default_factory=datetime.now, description="Record creation time")
    updated_at: datetime = Field(default_factory=datetime.now, description="Record update time")

    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }
        json_schema_extra = {
            "example": {
                "_id": "60d21b4967d0d8992e610c85",
                "title": "Avengers: Endgame",
                "overview": "After the devastating events of Avengers: Infinity War, the universe is in ruins...",
                "poster_url": "https://example.com/avengers_endgame_poster.jpg",
                "backdrop_url": "https://example.com/avengers_endgame_backdrop.jpg",
                "genres": ["Action", "Adventure", "Drama"],
                "release_date": "2019-04-26T00:00:00",
                "runtime": 181,
                "video_url": "https://example.com/avengers_endgame.mp4",
                "view_count": 1500000,
                "rating": 8.4,
                "created_at": "2021-06-20T15:30:00",
                "updated_at": "2021-06-20T15:30:00"
            }
        }

# MongoDB collection name for movies
MOVIE_COLLECTION = "movies"