from fastapi import APIRouter

from .auth import router as auth_router
from .movies import router as movies_router
from .profiles import router as profiles_router

"""
API Router
Router chính kết hợp tất cả các subrouters:
- Auth: Xác thực và phân quyền
- Movies: Quản lý phim
- Profiles: Quản lý thông tin người dùng
"""

api_router = APIRouter()

# Đăng ký các routers
api_router.include_router(auth_router)
api_router.include_router(movies_router)
api_router.include_router(profiles_router) 