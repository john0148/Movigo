"""
MovieLink schema for the FastAPI app.
Defines the data model for mapping movie to Google Drive stream link.
"""

from pydantic import BaseModel, Field, HttpUrl
from typing import Optional


class MovieLinkBase(BaseModel):
    """Base schema for a movie link mapping"""
    drive_url: str = Field(..., description="Google Drive file ID")


class MovieLinkInDB(MovieLinkBase):
    """Schema representing a movie link document in MongoDB"""
    movie_id: str = Field(..., description="Reference to Movie MongoDB document ID")

    class Config:
        from_attributes = True
        json_encoders = {
            # Thêm encoder cho ObjectId nếu cần
        }


class MovieLinkResponse(BaseModel):
    """Schema for response when requesting a movie link"""
    movie_id: str = Field(..., description="Movie ID")
    drive_url: str = Field(..., description="Google Drive file ID")

    class Config:
        from_attributes = True

