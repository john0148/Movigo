from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
import logging
from typing import Dict

from ..core.config import settings

# Global database instance
db: AsyncIOMotorDatabase = None
client = None

async def connect_to_mongodb():
    """
    Connect to MongoDB during application startup
    """
    global client, db
    try:
        logging.info(f"Attempting to connect to MongoDB at {settings.MONGODB_URL}")
        client = AsyncIOMotorClient(
            settings.MONGODB_URL, 
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000
        )
        
        # Thực hiện ping để kiểm tra kết nối
        await client.admin.command('ping')
        db = client[settings.MONGODB_NAME]
        logging.info(f"Successfully connected to MongoDB ({settings.MONGODB_NAME})")
        
        # Kiểm tra danh sách collections
        collections = await db.list_collection_names()
        logging.info(f"Available collections: {', '.join(collections) if collections else 'No collections found'}")
        
        # Kiểm tra khả năng truy cập vào collection users
        if "users" in collections:
            try:
                # Chỉ đếm số lượng users để kiểm tra truy cập
                users_count = await db.users.count_documents({})
                logging.info(f"Found {users_count} users in the database")
                
                if users_count == 0:
                    logging.warning("No users found in the database! Authentication may fail.")
            except Exception as e:
                logging.error(f"Error accessing users collection: {e}")
        else:
            logging.warning("Users collection not found in the database! Authentication may fail.")
        
        return db
    except Exception as e:
        logging.error(f"Failed to connect to MongoDB: {e}")
        client = None
        db = None
        # Không raise exception để ứng dụng vẫn có thể chạy với dữ liệu cục bộ
        return None

async def close_mongodb_connection():
    """
    Close MongoDB connection during application shutdown
    """
    try:
        global client
        if client:
            client.close()
            logging.info("MongoDB connection closed")
    except Exception as e:
        logging.error(f"Error closing MongoDB connection: {e}")

def get_db() -> AsyncIOMotorDatabase:
    """
    Return database instance
    """
    return db

async def test_connection() -> Dict:
    """
    Test MongoDB connection and return status
    """
    try:
        global client, db
        if client is None:
            client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=5000)
        
        # Thử ping để xác nhận kết nối
        await client.admin.command('ping')
        
        # Kiểm tra xem có thể truy cập đến database không
        if db is None:
            db = client[settings.MONGODB_NAME]
            initialize_crud_modules()
        
        # Thử truy vấn đơn giản
        collection_names = await db.list_collection_names()
        
        # Check users collection if it exists
        users_info = {}
        if "users" in collection_names:
            try:
                users_count = await db.users.count_documents({})
                users_info["total"] = users_count
                
                if users_count > 0:
                    # Get sample users (limit to 5, without exposing passwords)
                    sample_users = []
                    cursor = db.users.find(
                        {}, 
                        {"email": 1, "subscription_plan": 1, "role": 1, "_id": 0}
                    ).limit(5)
                    
                    async for user in cursor:
                        sample_users.append(user)
                    
                    users_info["samples"] = sample_users
                else:
                    users_info["warning"] = "No users found in database"
            except Exception as e:
                users_info["error"] = f"Error accessing users: {str(e)}"
        else:
            users_info["error"] = "Users collection not found"
        
        return {
            "status": "connected",
            "message": f"Successfully connected to MongoDB ({settings.MONGODB_NAME})",
            "collections": collection_names,
            "users_info": users_info
        }
    except Exception as e:
        error_msg = str(e)
        logging.error(f"MongoDB connection test failed: {error_msg}")
        
        # Xử lý hiển thị URL an toàn (ẩn mật khẩu)
        safe_url = "Not configured"
        if settings.MONGODB_URL:
            try:
                if "@" in settings.MONGODB_URL:
                    # Ví dụ: mongodb://user:pass@localhost:27017 -> mongodb://***:***@localhost:27017
                    parts = settings.MONGODB_URL.split("@")
                    if len(parts) >= 2:
                        protocol_and_auth = parts[0].split("://")
                        if len(protocol_and_auth) >= 2:
                            protocol = protocol_and_auth[0]
                            safe_url = f"{protocol}://***:***@{parts[1]}"
                        else:
                            safe_url = "mongodb://***:***@[hidden]"
                else:
                    # Không có thông tin xác thực, giữ nguyên URL
                    safe_url = settings.MONGODB_URL
            except Exception:
                # Nếu có lỗi khi phân tích URL, sử dụng giá trị an toàn
                safe_url = "mongodb://[parsing-error]"
        
        return {
            "status": "error",
            "message": f"Failed to connect to MongoDB: {error_msg}",
            "mongodb_url": safe_url
        }

def initialize_crud_modules():
    """
    Initialize all CRUD modules with the database instance
    """
    from ..crud import movie
    from ..crud import user
    from ..crud import watch_later 
    
    # Set db reference in each CRUD module
    movie.db = db
    user.db = db
    watch_later.db = db 
    
get_database = get_db
