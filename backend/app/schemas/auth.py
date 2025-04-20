"""
Authentication schemas for the FastAPI app.
Defines the data models for authentication-related operations including tokens,
password reset, and OAuth integrations.
"""

from typing import Optional
from pydantic import BaseModel, Field, EmailStr


class Token(BaseModel):
    """Schema for authentication tokens"""
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration time in seconds")
    refresh_token: Optional[str] = Field(None, description="Refresh token for obtaining new access tokens")


class TokenPayload(BaseModel):
    """Schema for JWT token payload"""
    sub: str = Field(..., description="Subject (user ID)")
    exp: int = Field(..., description="Expiration timestamp")


class LoginRequest(BaseModel):
    """Schema for login requests"""
    email: EmailStr = Field(..., description="User email")
    password: str = Field(..., description="User password")
    remember_me: bool = Field(default=False, description="Whether to remember the login")


class GoogleAuthRequest(BaseModel):
    """Schema for Google OAuth authentication requests"""
    token: str = Field(..., description="Google ID token")
    

class PasswordResetRequest(BaseModel):
    """Schema for password reset requests"""
    email: EmailStr = Field(..., description="User email")


class PasswordReset(BaseModel):
    """Schema for password reset confirmation"""
    token: str = Field(..., description="Password reset token")
    new_password: str = Field(..., description="New password")
    
    
class EmailVerification(BaseModel):
    """Schema for email verification"""
    token: str = Field(..., description="Email verification token") 