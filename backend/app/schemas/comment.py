# schemas/comment.py
from pydantic import BaseModel, Field
from typing import Optional
from bson import ObjectId

class CommentBase(BaseModel):
    user: str
    avatar: str
    time: str
    content: str
    likes: int = 0
    timestamp: str  # Ví dụ: "00:15:30"

class CommentCreate(CommentBase):
    movie_id: str  # ID dạng string (ObjectId dạng str)

class CommentInDB(CommentBase):
    id: Optional[str] = Field(alias="_id")
    movie_id: str

    class Config:
        allow_population_by_field_name = True
        json_encoders = {
            ObjectId: str
        }

class CommentResponse(CommentInDB):
    pass
