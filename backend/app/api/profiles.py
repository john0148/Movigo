from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Body, Query
from typing import Optional

from ..schemas.user import UserProfileUpdate, UserProfileOut, WatchStatsOut, UserPreferences, UserInDB
from ..services.profile_service import (
    update_user_profile,
    upload_user_avatar,
    get_user_watch_stats
)
from ..dependencies import get_current_user

"""
Profiles API Router
Xử lý các endpoints liên quan đến profile người dùng:
- Cập nhật thông tin cá nhân
- Upload ảnh đại diện
- Lấy thống kê xem phim
- Quản lý lịch sử xem phim và danh sách xem sau
"""

router = APIRouter(prefix="/users", tags=["profiles"])

@router.get("/profile", response_model=UserProfileOut)
async def get_profile(current_user: UserInDB = Depends(get_current_user)):
    """
    Lấy thông tin profile của user hiện tại
    """
    from bson import ObjectId
    from bson.errors import InvalidId
    from ..crud.user import UserCRUD, get_user_by_id
    
    # Allow both ObjectId and UUID/string IDs (same logic as dependencies.py)
    try:
        user_query_id = ObjectId(current_user.id)
    except (InvalidId, Exception):
        # Not a valid ObjectId → treat as string/UUID
        user_query_id = current_user.id
    
    # Get real user data from database
    real_user = await get_user_by_id(user_query_id)
    if not real_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Convert to safe dict format without hashed_password
    return UserCRUD.model_to_dict(real_user)

@router.patch("/profile", response_model=UserProfileOut)
async def update_profile(
    profile_data: UserProfileUpdate,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Cập nhật thông tin profile của user hiện tại
    """
    from bson import ObjectId
    from bson.errors import InvalidId
    from ..crud.user import UserCRUD
    
    # Allow both ObjectId and UUID/string IDs (same logic as dependencies.py)
    try:
        user_query_id = ObjectId(current_user.id)
    except (InvalidId, Exception):
        # Not a valid ObjectId → treat as string/UUID
        user_query_id = current_user.id
    
    updated_user = await update_user_profile(user_query_id, profile_data)
    if not updated_user:
        raise HTTPException(status_code=400, detail="Không thể cập nhật thông tin")
    
    # Convert to safe dict format
    return UserCRUD.model_to_dict(updated_user)

@router.post("/avatar", response_model=dict)
async def upload_avatar(
    avatar: UploadFile = File(...),
    current_user: UserInDB = Depends(get_current_user)
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
    
    from bson import ObjectId
    from bson.errors import InvalidId
    
    # Allow both ObjectId and UUID/string IDs (same logic as dependencies.py)
    try:
        user_query_id = ObjectId(current_user.id)
    except (InvalidId, Exception):
        # Not a valid ObjectId → treat as string/UUID
        user_query_id = current_user.id
    
    avatar_url = await upload_user_avatar(user_query_id, avatar)
    return {"success": True, "avatar_url": avatar_url}

@router.patch("/preferences", response_model=dict)
async def update_preferences(
    preferences: UserPreferences = Body(...),
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Cập nhật preferences của user hiện tại
    """
    from ..crud.user import update_user
    from bson import ObjectId
    from bson.errors import InvalidId
    
    # Allow both ObjectId and UUID/string IDs (same logic as dependencies.py)
    try:
        user_query_id = ObjectId(current_user.id)
    except (InvalidId, Exception):
        # Not a valid ObjectId → treat as string/UUID
        user_query_id = current_user.id
    
    # Convert to dict for database update
    preferences_dict = preferences.dict()
    
    # Update user preferences
    updated_user = await update_user(user_query_id, {"preferences": preferences_dict})
    if not updated_user:
        raise HTTPException(status_code=400, detail="Không thể cập nhật preferences")
    
    return {"success": True, "preferences": preferences_dict}

@router.get("/watch-stats", response_model=WatchStatsOut)
async def get_watch_stats(
    period: str = Query("week", description="Khoảng thời gian (week, month, year)"),
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Lấy thống kê thời lượng xem phim theo tuần/tháng/năm
    """
    if period not in ["week", "month", "year"]:
        raise HTTPException(
            status_code=400,
            detail="Khoảng thời gian không hợp lệ. Chọn 'week', 'month' hoặc 'year'"
        )
    
    from bson import ObjectId
    from bson.errors import InvalidId
    
    # Allow both ObjectId and UUID/string IDs (same logic as dependencies.py)
    try:
        user_query_id = ObjectId(current_user.id)
    except (InvalidId, Exception):
        # Not a valid ObjectId → treat as string/UUID
        user_query_id = current_user.id
    
    stats = await get_user_watch_stats(user_query_id, period)
    return stats

@router.get("/watch-history")
async def get_watch_history(
    page: int = Query(1, ge=1, description="Số trang"),
    limit: int = Query(10, ge=1, le=50, description="Số lượng kết quả mỗi trang"),
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Lấy lịch sử xem phim của user hiện tại
    """
    # Code xử lý lấy lịch sử xem phim
    # Phần này sẽ được cài đặt sau khi tính năng xem phim được hoàn thiện
    pass

@router.get("/watch-later")
async def get_watch_later(
    page: int = Query(1, ge=1, description="Số trang"),
    limit: int = Query(10, ge=1, le=50, description="Số lượng kết quả mỗi trang"),
    current_user: UserInDB = Depends(get_current_user)
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
    current_user: UserInDB = Depends(get_current_user)
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
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Xóa phim khỏi danh sách xem sau
    """
    # Code xử lý xóa khỏi danh sách xem sau
    # Phần này sẽ được cài đặt sau khi tính năng xem phim được hoàn thiện
    pass 