from typing import Optional, List
from datetime import datetime, date
from pydantic import BaseModel, EmailStr, Field, validator
from enum import Enum

"""
User schemas for the FastAPI app.
Defines the data models for user-related operations including registration, 
profile management, and settings.
"""

class SubscriptionType(str, Enum):
    """Enum for subscription types"""
    BASIC = "basic"
    STANDARD = "standard" 
    PREMIUM = "premium"


class Gender(str, Enum):
    """Enum for user gender options"""
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"


class Token(BaseModel):
    """
    Token schema sử dụng cho response JWT
    """
    access_token: str
    token_type: str = "bearer"
    refresh_token: Optional[str] = None


class GoogleToken(BaseModel):
    """
    Google auth token từ client
    """
    credential: str = Field(..., description="Google ID token")


class UserBase(BaseModel):
    """Base user schema with common attributes"""
    email: EmailStr = Field(..., description="User email address")
    full_name: Optional[str] = Field(None, description="User full name")
    phone: Optional[str] = Field(None, description="User phone number")
    

class UserCreate(UserBase):
    """Schema for creating a new user"""
    password: str = Field(..., description="User password")
    subscription_type: SubscriptionType = Field(default=SubscriptionType.BASIC, 
                                             description="Subscription type")
    
    @validator('password')
    def password_strength(cls, v):
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v


class UserSettings(BaseModel):
    """User settings schema"""
    subscription_type: SubscriptionType = Field(default=SubscriptionType.BASIC, 
                                             description="User subscription type")
    max_devices: int = Field(default=1, description="Maximum number of devices allowed")
    email_notifications: bool = Field(default=True, description="Email notification preference")
    auto_play: bool = Field(default=True, description="Auto-play preference")
    subtitles: bool = Field(default=True, description="Subtitles preference")


class UserUpdate(BaseModel):
    """Schema for updating user information (all fields optional)"""
    full_name: Optional[str] = None
    phone: Optional[str] = None
    birth_date: Optional[date] = None
    gender: Optional[Gender] = None
    avatar_url: Optional[str] = None
    password: Optional[str] = None
    
    @validator('password')
    def password_strength(cls, v):
        if v is not None and len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v


class UserInDB(UserBase):
    """Schema representing a user as stored in the database"""
    id: str = Field(..., description="User ID")
    hashed_password: str = Field(..., description="Hashed password")
    avatar_url: Optional[str] = Field(None, description="URL to user avatar")
    birth_date: Optional[date] = Field(None, description="User birth date")
    gender: Optional[Gender] = Field(None, description="User gender")
    is_active: bool = Field(default=True, description="Whether the user account is active")
    is_verified: bool = Field(default=False, description="Whether the user email is verified")
    created_at: datetime = Field(..., description="Timestamp when the user was created")
    updated_at: datetime = Field(..., description="Timestamp when the user was last updated")
    subscription_type: SubscriptionType = Field(default=SubscriptionType.BASIC)
    settings: UserSettings = Field(default_factory=UserSettings)

    class Config:
        from_attributes = True
        populate_by_name = True


class UserResponse(BaseModel):
    """Schema for user responses with selected fields"""
    id: str
    email: EmailStr
    full_name: Optional[str]
    phone: Optional[str]
    avatar_url: Optional[str]
    birth_date: Optional[date]
    gender: Optional[Gender]
    subscription_type: SubscriptionType
    created_at: datetime
    settings: UserSettings
    
    class Config:
        from_attributes = True
        populate_by_name = True


class UserOut(UserBase):
    """Schema response cho thông tin user"""
    id: str = Field(..., description="ID của user")
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    subscription_plan: str
    max_devices: int
    birth_date: Optional[datetime] = None
    gender: Optional[str] = None
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    """Schema cho cập nhật thông tin profile"""
    full_name: Optional[str] = None
    phone: Optional[str] = None
    birth_date: Optional[datetime] = None
    gender: Optional[str] = None

class UserProfileOut(UserOut):
    """Schema response cho profile"""
    pass


class WatchStatsBase(BaseModel):
    """Base schema cho thống kê xem phim"""
    pass


class WatchStatsOut(WatchStatsBase):
    """Schema response cho thống kê xem phim"""
    daily_minutes: Optional[List[int]] = None  # Số phút xem theo ngày (7 ngày trong tuần)
    monthly_minutes: Optional[List[int]] = None  # Số phút xem theo ngày (31 ngày trong tháng)
    yearly_minutes: Optional[List[int]] = None  # Số phút xem theo tháng (12 tháng trong năm)
    total_minutes: int = 0  # Tổng số phút xem


class WatchHistoryOut(BaseModel):
    """Schema response cho lịch sử xem phim"""
    id: str
    movie_id: str
    watch_date: datetime
    watch_duration: int
    completed: bool
    movie: Optional[dict] = None  # Thông tin ngắn gọn về phim


class WatchHistoryList(BaseModel):
    """Schema cho danh sách lịch sử xem phim"""
    items: List[WatchHistoryOut]
    total: int
    page: int
    limit: int
