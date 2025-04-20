from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import os
import random
from bson import ObjectId
from fastapi import UploadFile
import aiofiles
import shutil

from ..schemas.user import UserProfileUpdate
from ..crud.user import update_user

"""
Profile Service
Xử lý các chức năng liên quan đến profile người dùng:
- Cập nhật thông tin cá nhân
- Upload và lưu trữ avatar
- Tính toán thống kê thời lượng xem phim
"""

# Đường dẫn lưu file
UPLOAD_DIR = "uploads/avatars"

async def update_user_profile(
    user_id: ObjectId,
    profile_data: UserProfileUpdate
) -> Optional[Dict[str, Any]]:
    """
    Cập nhật thông tin profile của user
    """
    update_dict = profile_data.dict(exclude_unset=True)  # Chỉ lấy các trường có giá trị
    
    # Cập nhật user
    return await update_user(user_id, update_dict)

async def upload_user_avatar(user_id: ObjectId, avatar: UploadFile) -> str:
    """
    Upload và lưu trữ avatar
    """
    # Đảm bảo thư mục tồn tại
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    # Tạo tên file duy nhất
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    file_extension = os.path.splitext(avatar.filename)[1]
    filename = f"{user_id}_{timestamp}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    # Lưu file
    async with aiofiles.open(file_path, 'wb') as out_file:
        content = await avatar.read()
        await out_file.write(content)
    
    # URL để truy cập file
    avatar_url = f"/static/avatars/{filename}"
    
    # Cập nhật avatar_url cho user
    await update_user(user_id, {"avatar_url": avatar_url})
    
    return avatar_url

async def get_user_watch_stats(user_id: ObjectId, period: str = "week") -> Dict[str, Any]:
    """
    Tính toán thống kê thời lượng xem phim
    Kết quả là fake data cho mục đích demo
    """
    # Trong thực tế, sẽ lấy dữ liệu từ watch_history collection
    # và tính toán thống kê theo thời gian
    
    # Fake data cho mục đích demo
    stats = {
        "total_minutes": 0
    }
    
    if period == "week":
        # 7 ngày trong tuần
        daily_minutes = [random.randint(0, 240) for _ in range(7)]
        stats["daily_minutes"] = daily_minutes
        stats["total_minutes"] = sum(daily_minutes)
    
    elif period == "month":
        # 31 ngày trong tháng
        monthly_minutes = [random.randint(0, 240) for _ in range(31)]
        stats["monthly_minutes"] = monthly_minutes
        stats["total_minutes"] = sum(monthly_minutes)
    
    elif period == "year":
        # 12 tháng trong năm
        yearly_minutes = [random.randint(0, 5000) for _ in range(12)]
        stats["yearly_minutes"] = yearly_minutes
        stats["total_minutes"] = sum(yearly_minutes)
    
    return stats

async def add_watch_history(
    user_id: ObjectId,
    movie_id: ObjectId,
    duration: int,
    completed: bool = False
) -> bool:
    """
    Thêm vào lịch sử xem phim
    """
    # Trong thực tế, sẽ thêm bản ghi vào watch_history collection
    # Đây là phương thức giả lập cho mục đích demo
    
    # Giả lập thành công
    return True 