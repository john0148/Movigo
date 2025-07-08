from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..db.models.user import (
    UserModel, 
    WatchHistoryModel, 
    WatchLaterModel,
    USER_COLLECTION,
    WATCH_HISTORY_COLLECTION,
    WATCH_LATER_COLLECTION
)

"""
User CRUD Operations
Các hàm xử lý thao tác CRUD với collections users, watch_history, watch_later trong MongoDB
- get_user_by_email: Lấy user theo email
- get_user_by_id: Lấy user theo ID
- create_user: Tạo user mới
- update_user: Cập nhật thông tin user
- update_avatar: Cập nhật avatar
- get_user_watch_history: Lấy lịch sử xem phim
- get_user_watch_later: Lấy danh sách xem sau
"""

# Kết nối db được inject từ app startup
db: AsyncIOMotorDatabase = None

async def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """
    Lấy thông tin user theo email
    """
    return await db[USER_COLLECTION].find_one({"email": email})

async def get_user_by_id(user_id: Union[ObjectId, str]) -> Optional[Dict[str, Any]]:
    """
    Lấy thông tin user theo ID
    """
    return await db[USER_COLLECTION].find_one({"_id": user_id})

async def create_user(user_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Tạo user mới
    """
    # Thêm các trường mặc định
    user_data["created_at"] = datetime.now()
    user_data["updated_at"] = datetime.now()
    user_data["is_active"] = True
    
    # Normalize subscription field name to subscription_type for database storage
    if "subscription_plan" in user_data:
        user_data["subscription_type"] = user_data.pop("subscription_plan")
    
    # Ensure subscription_type has default value
    if "subscription_type" not in user_data:
        user_data["subscription_type"] = "basic"
    
    # Set default role if not provided
    if "role" not in user_data:
        user_data["role"] = "user"
    
    # Set default preferences if not provided
    if "preferences" not in user_data:
        user_data["preferences"] = {
            "language": "vi",
            "notifications_enabled": True
        }
    
    # Set max_devices dựa trên subscription_type
    if user_data.get("subscription_type") == "premium":
        user_data["max_devices"] = 4
    elif user_data.get("subscription_type") == "standard":
        user_data["max_devices"] = 2
    else:
        user_data["max_devices"] = 1
    
    # Insert vào database
    result = await db[USER_COLLECTION].insert_one(user_data)
    
    # Lấy user vừa tạo
    return await get_user_by_id(result.inserted_id)

async def update_user(user_id: Union[ObjectId, str], update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Cập nhật thông tin user
    """
    import logging
    logger = logging.getLogger(__name__)
    
    # Thêm updated_at
    update_data["updated_at"] = datetime.now()
    
    # Debug logging
    logger.info(f"🔄 Updating user {user_id} with data: {update_data}")
    logger.info(f"📊 Database connection: {db}")
    logger.info(f"📁 Collection name: {USER_COLLECTION}")
    
    # Check if db is None
    if db is None:
        logger.error("❌ Database connection is None!")
        raise RuntimeError("Database connection not initialized")
    
    # Update user and capture result
    result = await db[USER_COLLECTION].update_one(
        {"_id": user_id},
        {"$set": update_data}
    )
    
    # Log update result
    logger.info(f"📝 Update result: matched_count={result.matched_count}, modified_count={result.modified_count}")
    
    if result.matched_count == 0:
        logger.warning(f"⚠️ No user found with ID: {user_id}")
        return None
    
    if result.modified_count == 0:
        logger.warning(f"⚠️ User found but no changes made for ID: {user_id}")
    else:
        logger.info(f"✅ User {user_id} updated successfully")
    
    # Lấy user đã cập nhật
    updated_user = await get_user_by_id(user_id)
    logger.info(f"🔍 Retrieved updated user: {updated_user.get('full_name') if updated_user else 'None'}")
    
    return updated_user

async def update_avatar(user_id: Union[ObjectId, str], avatar_url: str) -> Optional[Dict[str, Any]]:
    """
    Cập nhật avatar URL
    """
    return await update_user(user_id, {"avatar_url": avatar_url})

async def add_watch_history(
    user_id: ObjectId, 
    movie_id: ObjectId, 
    watch_duration: int, 
    completed: bool = False
) -> Dict[str, Any]:
    """
    Thêm một bản ghi vào lịch sử xem phim
    - Nếu chưa tồn tại: tạo mới
    - Nếu đã tồn tại: cập nhật thời lượng và trạng thái
    """
    # Kiểm tra xem đã có bản ghi lịch sử xem phim này chưa
    existing = await db[WATCH_HISTORY_COLLECTION].find_one({
        "user_id": user_id,
        "movie_id": movie_id
    })
    
    watch_date = datetime.now()
    
    if existing:
        # Cập nhật bản ghi hiện có
        result = await db[WATCH_HISTORY_COLLECTION].update_one(
            {"_id": existing["_id"]},
            {"$set": {
                "watch_date": watch_date,
                "watch_duration": watch_duration,
                "completed": completed
            }}
        )
        
        # Lấy bản ghi đã cập nhật
        return await db[WATCH_HISTORY_COLLECTION].find_one({"_id": existing["_id"]})
    else:
        # Tạo bản ghi mới
        new_history = {
            "user_id": user_id,
            "movie_id": movie_id,
            "watch_date": watch_date,
            "watch_duration": watch_duration,
            "completed": completed
        }
        
        result = await db[WATCH_HISTORY_COLLECTION].insert_one(new_history)
        
        # Lấy bản ghi vừa tạo
        return await db[WATCH_HISTORY_COLLECTION].find_one({"_id": result.inserted_id})

async def get_user_watch_history(
    user_id: ObjectId, 
    page: int = 1, 
    limit: int = 10
) -> Dict[str, Any]:
    """
    Lấy lịch sử xem phim của user
    """
    skip = (page - 1) * limit
    
    # Lấy danh sách lịch sử xem
    cursor = db[WATCH_HISTORY_COLLECTION].find(
        {"user_id": user_id}
    ).sort("watch_date", -1).skip(skip).limit(limit)
    
    items = await cursor.to_list(length=limit)
    
    # Đếm tổng số bản ghi
    total = await db[WATCH_HISTORY_COLLECTION].count_documents({"user_id": user_id})
    
    # Map với thông tin phim
    for item in items:
        movie = await db["movies"].find_one(
            {"_id": item["movie_id"]}, 
            {"title": 1, "poster_url": 1}
        )
        if movie:
            item["movie"] = movie
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit
    }

async def get_user_watch_later(
    user_id: ObjectId, 
    page: int = 1, 
    limit: int = 10
) -> Dict[str, Any]:
    """
    Lấy danh sách phim xem sau của user
    """
    skip = (page - 1) * limit
    
    # Lấy danh sách phim xem sau
    cursor = db[WATCH_LATER_COLLECTION].find(
        {"user_id": user_id}
    ).sort("added_date", -1).skip(skip).limit(limit)
    
    items = await cursor.to_list(length=limit)
    
    # Đếm tổng số bản ghi
    total = await db[WATCH_LATER_COLLECTION].count_documents({"user_id": user_id})
    
    # Map với thông tin phim
    for item in items:
        movie = await db["movies"].find_one(
            {"_id": item["movie_id"]}, 
            {"title": 1, "poster_url": 1, "genres": 1, "rating": 1}
        )
        if movie:
            item["movie"] = movie
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit
    }

async def add_to_watch_later(user_id: ObjectId, movie_id: ObjectId) -> bool:
    """
    Thêm phim vào danh sách xem sau
    - Nếu đã tồn tại: cập nhật added_date
    - Nếu chưa tồn tại: thêm mới
    """
    # Kiểm tra đã tồn tại chưa
    existing = await db[WATCH_LATER_COLLECTION].find_one({
        "user_id": user_id,
        "movie_id": movie_id
    })
    
    if existing:
        # Cập nhật added_date
        result = await db[WATCH_LATER_COLLECTION].update_one(
            {"_id": existing["_id"]},
            {"$set": {"added_date": datetime.now()}}
        )
        return result.modified_count > 0
    else:
        # Thêm mới
        result = await db[WATCH_LATER_COLLECTION].insert_one({
            "user_id": user_id,
            "movie_id": movie_id,
            "added_date": datetime.now()
        })
        return result.inserted_id is not None

async def remove_from_watch_later(user_id: ObjectId, movie_id: ObjectId) -> bool:
    """
    Xóa phim khỏi danh sách xem sau
    """
    result = await db[WATCH_LATER_COLLECTION].delete_one({
        "user_id": user_id,
        "movie_id": movie_id
    })
    return result.deleted_count > 0

class UserCRUD:
    """
    User CRUD helper class
    """
    @staticmethod
    def model_to_dict(user):
        """
        Convert MongoDB user to dict format expected by frontend
        """
        # Handle both dict and object format
        if isinstance(user, dict):
            user_id = str(user.get("_id", "")) if user.get("_id") else ""
            email = user.get("email", "")
            full_name = user.get("full_name", "")
            # Handle both subscription_type (from DB) and subscription_plan
            subscription_plan = user.get("subscription_plan") or user.get("subscription_type", "basic")
            avatar_url = user.get("avatar_url", "")
            max_devices = user.get("max_devices", 1)
            role = user.get("role", "user")
            phone = user.get("phone", "")
            birth_date = user.get("birth_date")
            gender = user.get("gender")
            is_active = user.get("is_active", True)
            created_at = user.get("created_at", datetime.now())
            # Handle preferences object
            preferences = user.get("preferences", {
                "language": "vi",
                "notifications_enabled": True
            })
        else:
            # Object with attributes
            user_id = str(getattr(user, "_id", "") or getattr(user, "id", ""))
            email = getattr(user, "email", "")
            full_name = getattr(user, "full_name", "")
            subscription_plan = getattr(user, "subscription_plan", None) or getattr(user, "subscription_type", "basic")
            avatar_url = getattr(user, "avatar_url", "")
            max_devices = getattr(user, "max_devices", 1)
            role = getattr(user, "role", "user")
            phone = getattr(user, "phone", "")
            birth_date = getattr(user, "birth_date", None)
            gender = getattr(user, "gender", None)
            is_active = getattr(user, "is_active", True)
            created_at = getattr(user, "created_at", datetime.now())
            # Handle preferences object
            preferences = getattr(user, "preferences", {
                "language": "vi",
                "notifications_enabled": True
            })
        
        # Return dict in format that frontend expects
        return {
            "id": user_id,
            "email": email,
            "full_name": full_name,
            "subscription_plan": subscription_plan,
            "avatar_url": avatar_url,
            "max_devices": max_devices,
            "role": role,
            "phone": phone,
            "birth_date": birth_date,
            "gender": gender,
            "is_active": is_active,
            "created_at": created_at,
            "preferences": preferences
        } 