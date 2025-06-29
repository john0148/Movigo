from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class RatingOut(BaseModel):
    movie_id: str
    user_id: str
    name: str
    star_number: int
    comment: str
    created_at: Optional[datetime]

class RatingCreate(BaseModel):
    user_id: str
    name: str
    star_number: int
    comment: str
