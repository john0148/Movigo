from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Union
import jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from bson import ObjectId
import httpx
import json
import firebase_admin
from firebase_admin import auth as firebase_auth
from firebase_admin import credentials

from ..schemas.user import UserCreate
from ..crud.user import get_user_by_email, create_user, get_user_by_id, update_user
from ..core.config import settings

"""
Authentication Service
Xử lý các chức năng liên quan đến xác thực:
- Đăng nhập và xác thực thông thường
- Đăng ký tài khoản mới
- Xác thực Google OAuth
- Tạo và xác thực JWT token
"""

# Cấu hình mã hóa mật khẩu
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 Bearer token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Initialize Firebase Admin SDK
try:
    # Cách 1: Sử dụng service account key file
    import os
    service_account_path = os.path.join(os.path.dirname(__file__), "..", "..", "serviceAccountKey.json")
    
    if not firebase_admin._apps:
        if os.path.exists(service_account_path):
            cred = credentials.Certificate(service_account_path)
            firebase_admin.initialize_app(cred)
            print("Firebase Admin SDK initialized successfully with service account key")
        else:
            print(f"Service account key not found at: {service_account_path}")
            print("Please download your service account key from Firebase Console and place it at the above path")
            # Fallback to default credentials if service account key not found
            firebase_admin.initialize_app()
            print("Firebase Admin SDK initialized with default credentials")
except Exception as e:
    print(f"Warning: Firebase Admin SDK initialization failed: {e}")
    print("Firebase authentication will not work without proper configuration")
    print("Please check your service account key file and Firebase project settings")

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

# async def authenticate_user(email: str, password: str) -> Optional[Dict[str, Any]]:
#     """
#     Xác thực user với email và mật khẩu
#     """
#     user = await get_user_by_email(email)
#     if not user:
#         return None
    
#     if not user["is_active"]:
#         return None
    
#     # Kiểm tra nếu là tài khoản Google (không có mật khẩu)
#     if user.get("is_google_auth") and not user.get("hashed_password") and not user.get("password"):
#         return None
    
#     # Check if hashed_password exists in the user document
#     if "hashed_password" not in user:
#         # If not, check if there's a "password" field instead
#         if "password" in user:
#             # Use the password field as hashed_password
#             user["hashed_password"] = user["password"]
#         else:
#             return None
    
#     if not verify_password(password, user["hashed_password"]):
#         return None
    
#     return user

async def authenticate_user(email: str, password: str) -> Union[str, Dict[str, Any]]:
    user = await get_user_by_email(email)
    if not user:
        return "user_not_found"
    
    if not user.get("is_active", True):
        return "inactive"
    
    if user.get("is_google_auth") and not user.get("hashed_password") and not user.get("password"):
        return "google_only"
    
    if "hashed_password" not in user:
        user["hashed_password"] = user.get("password", "")
    
    if not verify_password(password, user["hashed_password"]):
        return "wrong_password"
    
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a new access token
    """
    to_encode = data.copy()
    expires_delta = expires_delta or timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a new refresh token with longer expiry
    """
    to_encode = data.copy()
    expires = expires_delta or timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 30)  # 30x longer
    expire = datetime.utcnow() + expires
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

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
    
    # Convert subscription_type to subscription_plan for consistency
    if "subscription_type" in user_dict:
        user_dict["subscription_plan"] = user_dict.pop("subscription_type")
    
    # Tạo user mới
    db_user = await create_user(user_dict)
    
    # Convert to proper format for response
    if db_user:
        from ..crud.user import UserCRUD
        return UserCRUD.model_to_dict(db_user)
    
    return None

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
        if token_info.get("aud") != settings.GOOGLE_CLIENT_ID:
            return None
        
        # Lấy thông tin user
        email = token_info.get("email")
        if not email:
            return None
        
        # Kiểm tra user đã tồn tại chưa
        existing_user = await get_user_by_email(email)
        if existing_user:
            print(f"Found existing Google user: {existing_user}")
            # Cập nhật is_google_auth nếu chưa đúng
            if not existing_user.get("is_google_auth"):
                await update_user(existing_user["_id"], {"is_google_auth": True})
                # Reload user data
                existing_user = await get_user_by_email(email)
                print(f"Updated existing user: {existing_user}")
            from ..crud.user import UserCRUD
            converted_user = UserCRUD.model_to_dict(existing_user)
            print(f"Converted existing user dict: {converted_user}")
            return converted_user
        
        # Tạo user mới với thông tin từ Google
        user_data = {
            "email": email,
            "full_name": token_info.get("name"),
            "is_google_auth": True,
            "subscription_plan": "basic",
            "avatar_url": token_info.get("picture")
        }
        
        print(f"Creating new Google user with data: {user_data}")
        db_user = await create_user(user_data)
        print(f"Created DB user: {db_user}")
        
        if db_user:
            from ..crud.user import UserCRUD
            converted_user = UserCRUD.model_to_dict(db_user)
            print(f"Converted user dict: {converted_user}")
            return converted_user
        return None
    except Exception as e:
        print(f"Google token verification error: {e}")
        return None

async def verify_firebase_token(firebase_id_token: str) -> Optional[Dict[str, Any]]:
    """
    Xác thực Firebase ID token và lấy thông tin user
    """
    try:
        # Verify Firebase ID token
        decoded_token = firebase_auth.verify_id_token(firebase_id_token)
        
        # Lấy thông tin user từ Firebase token
        email = decoded_token.get("email")
        if not email:
            print("No email found in Firebase token")
            return None
        
        # Kiểm tra user đã tồn tại chưa
        existing_user = await get_user_by_email(email)
        if existing_user:
            print(f"Found existing Firebase user: {existing_user}")
            # Cập nhật is_google_auth nếu chưa đúng
            if not existing_user.get("is_google_auth"):
                await update_user(existing_user["_id"], {"is_google_auth": True})
                # Reload user data
                existing_user = await get_user_by_email(email)
                print(f"Updated existing Firebase user: {existing_user}")
            from ..crud.user import UserCRUD
            converted_user = UserCRUD.model_to_dict(existing_user)
            print(f"Converted existing Firebase user dict: {converted_user}")
            return converted_user
        
        # Tạo user mới với thông tin từ Firebase
        user_data = {
            "email": email,
            "full_name": decoded_token.get("name"),
            "is_google_auth": True,
            "subscription_plan": "basic",
            "avatar_url": decoded_token.get("picture")
        }
        
        print(f"Creating new user from Firebase token: {email}")
        print(f"Firebase user data: {user_data}")
        db_user = await create_user(user_data)
        print(f"Created Firebase DB user: {db_user}")
        
        if db_user:
            from ..crud.user import UserCRUD
            converted_user = UserCRUD.model_to_dict(db_user)
            print(f"Converted Firebase user dict: {converted_user}")
            return converted_user
        return None
        
    except firebase_auth.InvalidIdTokenError:
        print("Invalid Firebase ID token")
        return None
    except firebase_auth.ExpiredIdTokenError:
        print("Expired Firebase ID token")
        return None
    except Exception as e:
        print(f"Firebase token verification error: {e}")
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
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
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
    # Convert to proper format for response
    from ..crud.user import UserCRUD
    return UserCRUD.model_to_dict(current_user)

async def create_tokens_for_user(user, is_google=False):
    """
    Tạo access token và refresh token cho user
    """
    from ..crud.user import UserCRUD
    user_dict = UserCRUD.model_to_dict(user)
    
    # Handle both dict and object formats for user
    if isinstance(user, dict):
        # Check for both "_id" (from DB) and "id" (from UserCRUD.model_to_dict)
        user_id = str(user.get("_id", "") or user.get("id", ""))
        email = user.get("email", "")
        role = user.get("role", "user")
    else:
        # Assume it's an object with attributes
        user_id = str(getattr(user, "_id", "") or getattr(user, "id", ""))
        email = getattr(user, "email", "")
        role = getattr(user, "role", "user")
    
    # Debug logging để trace vấn đề
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"🔑 Creating tokens for user_id: '{user_id}', email: '{email}', role: '{role}'")
    
    if not user_id:
        logger.error(f"❌ User ID is empty! User data: {user}")
        logger.error(f"❌ User dict: {user_dict}")
        raise ValueError("User ID cannot be empty when creating tokens")
    
    # Create access token with user_id as subject
    access_token = create_access_token(
        data={"sub": user_id, "email": email, "role": role}
    )
    
    # Create refresh token
    refresh_token = create_refresh_token(
        data={"sub": user_id}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": refresh_token,
        "expires_in": settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": user_dict
    } 