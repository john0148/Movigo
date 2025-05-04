from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr
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
        schema = handler(core_schema)
        schema.update(type="string")
        return schema

"""
User Model
Mô hình dữ liệu cho bảng người dùng trong MongoDB
Các fields:
- id: ObjectId của MongoDB
- email: Email người dùng (unique)
- hashed_password: Mật khẩu đã hash
- full_name: Họ tên đầy đủ
- phone: Số điện thoại
- avatar_url: URL ảnh đại diện
- subscription_plan: Gói dịch vụ (basic, standard, premium)
- max_devices: Số lượng thiết bị tối đa có thể xem
- birth_date: Ngày sinh
- gender: Giới tính
- is_active: Trạng thái tài khoản
- is_google_auth: Tài khoản đăng nhập bằng Google
- created_at: Thời gian tạo tài khoản
- updated_at: Thời gian cập nhật tài khoản
"""

class UserModel(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    email: EmailStr = Field(...)
    hashed_password: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    subscription_plan: str = Field(default="basic")  # basic, standard, premium
    max_devices: int = Field(default=1)
    birth_date: Optional[datetime] = None
    gender: Optional[str] = None  # male, female, other
    is_active: bool = Field(default=True)
    is_google_auth: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }
        json_schema_extra = {
            "example": {
                "_id": "60d21b4967d0d8992e610c85",
                "email": "user@example.com",
                "hashed_password": "hashedpassword123",
                "full_name": "Nguyen Van A",
                "phone": "0912345678",
                "avatar_url": "https://example.com/avatar.jpg",
                "subscription_plan": "standard",
                "max_devices": 2,
                "birth_date": "1990-01-01T00:00:00",
                "gender": "male",
                "is_active": True,
                "is_google_auth": False,
                "created_at": "2021-06-20T15:30:00",
                "updated_at": "2021-06-20T15:30:00"
            }
        }

"""
WatchHistory Model
Mô hình dữ liệu cho lịch sử xem phim
Các fields:
- id: ObjectId của MongoDB
- user_id: ID người dùng
- movie_id: ID phim
- watch_date: Thời gian xem
- watch_duration: Thời lượng đã xem (phút)
- completed: Đã xem hết phim hay chưa
"""

class WatchHistoryModel(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId = Field(...)
    movie_id: PyObjectId = Field(...)
    watch_date: datetime = Field(default_factory=datetime.now)
    watch_duration: int = Field(...)  # Thời lượng đã xem (phút)
    completed: bool = Field(default=False)

    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }

"""
WatchLater Model
Mô hình dữ liệu cho danh sách phim xem sau
Các fields:
- id: ObjectId của MongoDB
- user_id: ID người dùng
- movie_id: ID phim
- added_date: Thời gian thêm vào danh sách
"""

class WatchLaterModel(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId = Field(...)
    movie_id: PyObjectId = Field(...)
    added_date: datetime = Field(default_factory=datetime.now)

    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }

# MongoDB collection names
USER_COLLECTION = "users"
WATCH_HISTORY_COLLECTION = "watch_history"
WATCH_LATER_COLLECTION = "watch_later"