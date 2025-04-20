from typing import Optional
from pydantic import BaseModel

"""
Token Schemas
Pydantic schemas cho token authentication
- Token: JWT auth token response
- TokenPayload: Token payload (subject, expiration)
"""

class Token(BaseModel):
    """
    JWT Token schema
    """
    access_token: str
    token_type: str = "bearer"
    refresh_token: Optional[str] = None

class TokenPayload(BaseModel):
    """
    JWT Token payload 
    """
    sub: Optional[str] = None  # User ID
    exp: Optional[int] = None  # Expiration timestamp
