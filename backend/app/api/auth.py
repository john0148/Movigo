from fastapi import APIRouter, Depends, HTTPException, Body, status
from fastapi.security import OAuth2PasswordRequestForm

from ..schemas.user import UserCreate, UserOut, Token, GoogleToken
from ..services.auth_service import (
    authenticate_user,
    create_access_token,
    register_new_user,
    get_current_active_user,
    verify_google_token,
    create_tokens_for_user
)

"""
Authentication API Router
Xử lý các endpoints liên quan đến xác thực:
- Đăng nhập thông thường
- Đăng ký tài khoản mới
- Đăng nhập/Đăng ký bằng Google
- Lấy thông tin user hiện tại
- Refresh token
"""

router = APIRouter(tags=["authentication"])

@router.post("/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Đăng nhập và nhận JWT token
    """
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không đúng",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return await create_tokens_for_user(user)

@router.post("/register", response_model=UserOut)
async def register_user(user: UserCreate):
    """
    Đăng ký tài khoản mới
    """
    db_user = await register_new_user(user)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email đã được sử dụng"
        )
    return db_user

@router.post("/google", response_model=Token)
async def login_with_google(token_data: GoogleToken = Body(...)):
    """
    Đăng nhập hoặc đăng ký bằng Google
    - Nếu email chưa tồn tại: tạo tài khoản mới
    - Nếu email đã tồn tại: đăng nhập
    """
    user_info = await verify_google_token(token_data.credential)
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token Google không hợp lệ",
        )
    
    # Đã xác thực thành công, tạo token
    return await create_tokens_for_user(user_info, is_google=True)

@router.get("/me", response_model=UserOut)
async def read_users_me(current_user = Depends(get_current_active_user)):
    """
    Lấy thông tin user hiện tại
    """
    return current_user

@router.post("/refresh", response_model=Token)
async def refresh_access_token(refresh_token: str = Body(..., embed=True)):
    """
    Refresh token để lấy access token mới
    """
    try:
        tokens = await create_access_token(refresh_token=refresh_token)
        return tokens
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token không hợp lệ hoặc đã hết hạn",
            headers={"WWW-Authenticate": "Bearer"},
        ) 