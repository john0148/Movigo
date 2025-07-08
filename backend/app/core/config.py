from pydantic_settings import BaseSettings, SettingsConfigDict
import os
from typing import Optional, List

"""
Settings Configuration
Quản lý các cấu hình, biến môi trường và secrets của ứng dụng
"""

# class Settings(BaseSettings):
#     """
#     Settings được load từ biến môi trường hoặc .env file
#     Sử dụng Pydantic BaseSettings để tự động validate types
#     """
#     # API configs
#     API_V1_PREFIX: str = "/api/v1"
#     PROJECT_NAME: str = "Movigo API"
#     LOG_LEVEL: str = "INFO"
#     APP_NAME: str = "Movigo"
#     APP_DESCRIPTION: str = ""
#     APP_VERSION: str = "0.0.0"
#     SHOW_DOCS: bool = True

#     # MongoDB settings
#     MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
#     MONGODB_NAME: str = os.getenv("MONGODB_NAME", "movigo")

#     # JWT settings
#     JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "your-secret-key-for-jwt")
#     JWT_ALGORITHM: str = "HS256"
#     JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

#     # Google OAuth settings
#     GOOGLE_CLIENT_ID: Optional[str] = os.getenv("GOOGLE_CLIENT_ID")
#     GOOGLE_CLIENT_SECRET: Optional[str] = os.getenv("GOOGLE_CLIENT_SECRET")

#     # CORS settings - allow frontend origins
#     CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:5173"]

#     # File upload settings
#     UPLOAD_DIR: str = "uploads"
#     AVATAR_DIR: str = "uploads/avatars"
#     MAX_UPLOAD_SIZE: int = 5 * 1024 * 1024  # 5MB

#     TMDB_API_KEY:str = "12b062a4565a76aa9b24f20c65b03135"

#     model_config = {
#         "env_file": ".env",
#         "env_file_encoding": "utf-8",
#         "case_sensitive": True
#     }

# # Export settings instance
# settings = Settings()


from pydantic import validator, Field
class Settings(BaseSettings):
    # API configs
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "Movigo API"
    LOG_LEVEL: str = "INFO"
    APP_NAME: str = "Movigo"
    APP_DESCRIPTION: str = ""
    APP_VERSION: str = "0.0.0"
    SHOW_DOCS: bool = True

    # MongoDB settings
    MONGODB_URL: str
    MONGODB_NAME: str

    # JWT settings
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Google OAuth settings
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None

    # CORS settings - allow frontend origins
    # CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    @validator("CORS_ORIGINS", pre=True)
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            # Chia bằng dấu phẩy, loại bỏ khoảng trắng dư
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        elif isinstance(v, list):
            return v
        raise ValueError("CORS_ORIGINS must be a comma-separated string or a list")

    # File upload settings
    UPLOAD_DIR: str = "uploads"
    AVATAR_DIR: str = "uploads/avatars"
    MAX_UPLOAD_SIZE: int = 5 * 1024 * 1024  # 5MB

    # TMDB
    TMDB_API_KEY: str

    # model_config = {
    #     "env_file": ".env",
    #     "env_file_encoding": "utf-8",
    #     "case_sensitive": True
    # }
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )
    
    # Chế độ DEBUG dùng để bật/tắt kiểm tra phân quyền
    DEBUG: bool = False

settings = Settings()
