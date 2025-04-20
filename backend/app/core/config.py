from pydantic import BaseSettings
import os
from typing import Optional

"""
Settings Configuration
Quản lý các cấu hình, biến môi trường và secrets của ứng dụng
"""

class Settings(BaseSettings):
    """
    Settings được load từ biến môi trường hoặc .env file
    Sử dụng Pydantic BaseSettings để tự động validate types
    """
    # API configs
    API_V1_PREFIX: str = "/api"
    PROJECT_NAME: str = "Movigo API"
    
    # MongoDB settings
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    MONGODB_NAME: str = os.getenv("MONGODB_NAME", "movigo")
    
    # JWT settings
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "your-secret-key-for-jwt")
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Google OAuth settings
    GOOGLE_CLIENT_ID: Optional[str] = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET: Optional[str] = os.getenv("GOOGLE_CLIENT_SECRET")
    
    # CORS settings - allow frontend origins
    CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:5173"]
    
    # File upload settings
    UPLOAD_DIR: str = "uploads"
    AVATAR_DIR: str = "uploads/avatars"
    MAX_UPLOAD_SIZE: int = 5 * 1024 * 1024  # 5MB
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

# Export settings instance
settings = Settings()