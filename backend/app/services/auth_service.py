from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from bson import ObjectId
import httpx
import json

from ..schemas.user import UserCreate
from ..crud.user import get_user_by_email, create_user, get_user_by_id

"""
Authentication Service
Xử lý các chức năng liên quan đến xác thực:
- Đăng nhập và xác thực thông thường
- Đăng ký tài khoản mới
- Xác thực Google OAuth
- Tạo và xác thực JWT token
"""

# Cấu hình JWT
SECRET_KEY = "YOUR_SECRET_KEY"  # Thay đổi trong production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 ngày
REFRESH_TOKEN_EXPIRE_MINUTES = 60 * 24 * 30  # 30 ngày

# Google OAuth
GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID"  # Thay đổi trong production

# Cấu hình mã hóa mật khẩu
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 Bearer token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Kiểm tra mật khẩu
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Mã hóa mật khẩu
    """
    return pwd_context.hash(password)

async def authenticate_user(email: str, password: str) -> Optional[Dict[str, Any]]:
    """
    Xác thực user với email và mật khẩu
    """
    user = await get_user_by_email(email)
    if not user:
        return None
    
    if not user["is_active"]:
        return None
    
    # Kiểm tra nếu là tài khoản Google (không có mật khẩu)
    if user.get("is_google_auth") and not user.get("hashed_password"):
        return None
    
    if not verify_password(password, user["hashed_password"]):
        return None
    
    return user

async def create_access_token(
    data: dict = None,
    expires_delta: Optional[timedelta] = None,
    user_id: str = None,
    refresh_token: str = None
) -> Dict[str, str]:
    """
    Tạo JWT token
    - Nếu có refresh_token: dùng để tạo access token mới
    - Nếu không: tạo cả access và refresh token mới
    """
    if refresh_token:
        # Xác thực refresh token
        try:
            payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("sub")
            if user_id is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid refresh token",
                )
        except jwt.PyJWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )
        
        # Kiểm tra user tồn tại
        user = await get_user_by_id(ObjectId(user_id))
        if not user or not user["is_active"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
            )
        
        # Tạo access token mới
        data = {"sub": user_id}
    
    to_encode = data.copy() if data else {"sub": str(user_id)}
    
    # Access token
    access_expires = expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_expire_time = datetime.utcnow() + access_expires
    to_encode.update({"exp": access_expire_time})
    access_token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    # Refresh token (nếu không có refresh_token input)
    if not refresh_token:
        refresh_expires = timedelta(minutes=REFRESH_TOKEN_EXPIRE_MINUTES)
        refresh_expire_time = datetime.utcnow() + refresh_expires
        refresh_to_encode = {"sub": to_encode["sub"], "exp": refresh_expire_time}
        refresh_token = jwt.encode(refresh_to_encode, SECRET_KEY, algorithm=ALGORITHM)
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "refresh_token": refresh_token
        }
    else:
        return {
            "access_token": access_token,
            "token_type": "bearer"
        }

async def register_new_user(user_data: UserCreate) -> Optional[Dict[str, Any]]:
    """
    Đăng ký user mới
    """
    # Kiểm tra email đã tồn tại chưa
    existing_user = await get_user_by_email(user_data.email)
    if existing_user:
        return None
    
    # Mã hóa mật khẩu
    hashed_password = get_password_hash(user_data.password)
    
    # Chuẩn bị dữ liệu
    user_dict = user_data.dict()
    user_dict.pop("password")
    user_dict["hashed_password"] = hashed_password
    user_dict["is_google_auth"] = False
    
    # Tạo user mới
    return await create_user(user_dict)

async def verify_google_token(google_token: str) -> Optional[Dict[str, Any]]:
    """
    Xác thực Google ID token và lấy thông tin user
    """
    try:
        # Verify token với Google API
        url = f"https://oauth2.googleapis.com/tokeninfo?id_token={google_token}"
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            token_info = response.json()
            
        # Kiểm tra token hợp lệ
        if token_info.get("aud") != GOOGLE_CLIENT_ID:
            return None
        
        # Lấy thông tin user
        email = token_info.get("email")
        if not email:
            return None
        
        # Kiểm tra user đã tồn tại chưa
        existing_user = await get_user_by_email(email)
        if existing_user:
            # Cập nhật is_google_auth nếu chưa đúng
            if not existing_user.get("is_google_auth"):
                await update_user(existing_user["_id"], {"is_google_auth": True})
            return existing_user
        
        # Tạo user mới với thông tin từ Google
        user_data = {
            "email": email,
            "full_name": token_info.get("name"),
            "is_google_auth": True,
            "subscription_plan": "basic",
            "avatar_url": token_info.get("picture")
        }
        
        return await create_user(user_data)
    except Exception as e:
        print(f"Google token verification error: {e}")
        return None

async def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """
    Lấy thông tin user hiện tại từ JWT token
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decode JWT token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    # Lấy thông tin user
    user = await get_user_by_id(ObjectId(user_id))
    if user is None:
        raise credentials_exception
    
    return user

async def get_current_active_user(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Kiểm tra user hiện tại có active không
    """
    if not current_user.get("is_active"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user

async def create_tokens_for_user(user: Dict[str, Any], is_google: bool = False) -> Dict[str, str]:
    """
    Tạo JWT tokens cho user
    """
    # Dữ liệu để encode vào token
    data = {
        "sub": str(user["_id"]),
        "email": user["email"]
    }
    
    # Tạo tokens
    return await create_access_token(data=data) 