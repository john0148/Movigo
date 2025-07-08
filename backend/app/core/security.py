from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from app.services.auth_service import get_current_user
from typing import Dict, Any

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# class get_current_user():
#     pass

# async def require_admin(current_user = Depends(get_current_user)):
#     if current_user.role != "admin":
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Bạn không có quyền truy cập"
#         )
#     return current_user

async def require_admin(current_user: Dict[str, Any] = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền truy cập"
        )
    return current_user
