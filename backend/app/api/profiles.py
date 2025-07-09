from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Body, Query
from typing import Optional,Dict, Any
import logging
from ..dependencies import get_watch_history_crud
from ..schemas.user import UserProfileUpdate, UserProfileOut, WatchStatsOut,UserInDB
from ..services.profile_service import (
    update_user_profile,
    upload_user_avatar,
    get_user_watch_stats
)


from ..db.models.user import UserModel
from ..crud.watch_history import WatchHistoryCRUD
from ..schemas.profile import WatchHistoryResponse

from ..services.auth_service import get_current_user
from ..db.models.user import UserModel
"""
Profiles API Router
Xử lý các endpoints liên quan đến profile người dùng:
- Cập nhật thông tin cá nhân
- Upload ảnh đại diện
- Lấy thống kê xem phim
- Quản lý lịch sử xem phim và danh sách xem sau
"""

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/users", tags=["profiles"])

@router.get("/profile", response_model=UserProfileOut)
async def get_profile(current_user: UserModel = Depends(get_current_user)):
    """
    Lấy thông tin profile của user hiện tại
    """
    return current_user

@router.patch("/profile", response_model=UserProfileOut)
async def update_profile(
    profile_data: UserProfileUpdate,
    current_user: UserModel = Depends(get_current_user)
):
    """
    Cập nhật thông tin profile của user hiện tại
    """
    updated_user = await update_user_profile(current_user.id, profile_data)
    if not updated_user:
        raise HTTPException(status_code=400, detail="Không thể cập nhật thông tin")
    return updated_user

@router.post("/avatar", response_model=dict)
async def upload_avatar(
    avatar: UploadFile = File(...),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Upload ảnh đại diện cho user hiện tại
    """
    # Kiểm tra file type
    if avatar.content_type not in ["image/jpeg", "image/png", "image/jpg"]:
        raise HTTPException(
            status_code=400,
            detail="Chỉ chấp nhận file ảnh định dạng JPEG, JPG hoặc PNG"
        )
    
    avatar_url = await upload_user_avatar(current_user.id, avatar)
    return {"success": True, "avatar_url": avatar_url}

@router.get("/watch-stats", response_model=WatchStatsOut)
async def get_watch_stats(
    period: str = Query("week", description="Khoảng thời gian (week, month, year)"),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Lấy thống kê thời lượng xem phim theo tuần/tháng/năm
    """
    if period not in ["week", "month", "year"]:
        raise HTTPException(
            status_code=400,
            detail="Khoảng thời gian không hợp lệ. Chọn 'week', 'month' hoặc 'year'"
        )
    
    stats = await get_user_watch_stats(current_user.id, period)
    return stats

 #api/profiles.py - Cập nhật endpoint
@router.get("/watch-history", response_model=WatchHistoryResponse)
async def get_watch_history(
    page: int = Query(1, ge=1, description="Số trang"),
    limit: int = Query(10, ge=1, le=50, description="Số lượng kết quả mỗi trang"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    watch_history_crud: WatchHistoryCRUD = Depends(get_watch_history_crud)
):
    """
    Lấy lịch sử xem phim của user hiện tại (có phân trang)
    """
    try:
        skip = (page - 1) * limit

        # Lấy user_id từ current_user dict
        user_id = str(current_user.get("_id") or current_user.get("id"))

        # Lấy danh sách lịch sử
        items = await watch_history_crud.get_user_history(
            user_id=user_id, 
            skip=skip, 
            limit=limit
        )

        # Đếm tổng số lịch sử
        total = await watch_history_crud.count_user_history(user_id)

        return WatchHistoryResponse(
            items=items,
            total=total,
            page=page,
            limit=limit
        )

    except Exception as e:
        logger.exception(f"Lỗi khi lấy lịch sử xem phim: {str(e)}")
        logger.error(f"Current user type: {type(current_user)}, content: {current_user}")
        raise HTTPException(status_code=500, detail="Không thể lấy lịch sử xem phim")

@router.get("/watch-later")
async def get_watch_later(
    page: int = Query(1, ge=1, description="Số trang"),
    limit: int = Query(10, ge=1, le=50, description="Số lượng kết quả mỗi trang"),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Lấy danh sách phim xem sau của user hiện tại
    """
    # Code xử lý lấy danh sách xem sau
    # Phần này sẽ được cài đặt sau khi tính năng xem phim được hoàn thiện
    pass

@router.post("/watch-later", response_model=dict)
async def add_to_watch_later(
    movie_id: str = Body(..., embed=True),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Thêm phim vào danh sách xem sau
    """
    # Code xử lý thêm vào danh sách xem sau
    # Phần này sẽ được cài đặt sau khi tính năng xem phim được hoàn thiện
    pass

@router.delete("/watch-later/{movie_id}", response_model=dict)
async def remove_from_watch_later(
    movie_id: str,
    current_user: UserModel = Depends(get_current_user)
):
    """
    Xóa phim khỏi danh sách xem sau
    """
    # Code xử lý xóa khỏi danh sách xem sau
    # Phần này sẽ được cài đặt sau khi tính năng xem phim được hoàn thiện
    pass 