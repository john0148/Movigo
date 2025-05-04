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
        """
        Tùy chỉnh schema khi xuất ra OpenAPI/JSON Schema (chuẩn Pydantic v2).
        """
        schema = handler(core_schema)
        schema.update(type="string")
        return schema

"""
Movie Model
Mô hình dữ liệu cho bảng phim trong MongoDB
Các fields:
- id: ObjectId của MongoDB
- title: Tên phim
- description: Mô tả phim
- poster_url: URL ảnh poster
- backdrop_url: URL ảnh nền lớn
- genres: Danh sách thể loại phim
- release_date: Ngày phát hành
- duration: Thời lượng phim (phút)
- video_url: URL video phim
- view_count: Số lượt xem (dùng để hiển thị danh sách phim xem nhiều)
- rating: Điểm đánh giá trung bình
- created_at: Thời gian tạo bản ghi
- updated_at: Thời gian cập nhật bản ghi
"""

class MovieModel(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    title: str = Field(...)
    description: str = Field(...)
    poster_url: str = Field(...)
    backdrop_url: Optional[str] = None
    genres: List[str] = Field(...)
    release_date: datetime = Field(...)
    duration: int = Field(...)  # Thời lượng phim theo phút
    video_url: str = Field(...)
    view_count: int = Field(default=0)  # Số lượt xem
    rating: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }
        schema_extra = {
            "example": {
                "_id": "60d21b4967d0d8992e610c85",
                "title": "Avengers: Endgame",
                "description": "After the devastating events of Avengers: Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more in order to reverse Thanos' actions and restore balance to the universe.",
                "poster_url": "https://example.com/avengers_endgame_poster.jpg",
                "backdrop_url": "https://example.com/avengers_endgame_backdrop.jpg",
                "genres": ["Action", "Adventure", "Drama"],
                "release_date": "2019-04-26T00:00:00",
                "duration": 181,
                "video_url": "https://example.com/avengers_endgame.mp4",
                "view_count": 1500000,
                "rating": 8.4,
                "created_at": "2021-06-20T15:30:00",
                "updated_at": "2021-06-20T15:30:00"
            }
        }

# MongoDB collection name cho phim
MOVIE_COLLECTION = "movies" 