import asyncio
import sys
import os
from datetime import datetime

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import connect_to_mongodb, close_mongodb_connection
from app.core.security import get_password_hash
from bson import ObjectId

async def create_admin_user():
    """Tạo admin user để test admin dashboard"""
    
    try:
        # Kết nối MongoDB
        db = await connect_to_mongodb()
        if db is None:
            print("❌ Không thể kết nối MongoDB")
            return
        
        print("✅ Đã kết nối MongoDB")
        
        # Thông tin admin user
        admin_data = {
            "_id": ObjectId(),
            "email": "admin@movigo.com",
            "hashed_password": get_password_hash("admin123"),
            "full_name": "Admin User",
            "role": "admin",
            "subscription_plan": "premium",
            "max_devices": 10,
            "is_active": True,
            "is_google_auth": False,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "preferences": {
                "language": "vi",
                "notifications_enabled": True
            }
        }
        
        # Kiểm tra xem admin đã tồn tại chưa
        existing_admin = await db.users.find_one({"email": "admin@movigo.com"})
        
        if existing_admin:
            # Cập nhật role thành admin
            await db.users.update_one(
                {"email": "admin@movigo.com"},
                {"$set": {"role": "admin", "updated_at": datetime.now()}}
            )
            print("✅ Đã cập nhật user thành admin: admin@movigo.com")
        else:
            # Tạo admin mới
            result = await db.users.insert_one(admin_data)
            print(f"✅ Đã tạo admin user mới: admin@movigo.com")
            print(f"   User ID: {result.inserted_id}")
        
        # Tạo thêm một số user bình thường để test
        test_users = [
            {
                "_id": ObjectId(),
                "email": "user1@test.com",
                "hashed_password": get_password_hash("user123"),
                "full_name": "Test User 1",
                "role": "user",
                "subscription_plan": "basic",
                "max_devices": 2,
                "is_active": True,
                "is_google_auth": False,
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
                "preferences": {
                    "language": "vi",
                    "notifications_enabled": True
                }
            },
            {
                "_id": ObjectId(),
                "email": "user2@test.com", 
                "hashed_password": get_password_hash("user123"),
                "full_name": "Test User 2",
                "role": "user",
                "subscription_plan": "premium",
                "max_devices": 4,
                "is_active": False,  # User bị ban
                "is_google_auth": False,
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
                "preferences": {
                    "language": "vi",
                    "notifications_enabled": True
                }
            }
        ]
        
        for user in test_users:
            existing_user = await db.users.find_one({"email": user["email"]})
            if not existing_user:
                await db.users.insert_one(user)
                print(f"✅ Đã tạo test user: {user['email']}")
        
        print("\n🎯 THÔNG TIN ĐĂNG NHẬP ADMIN:")
        print("   Email: admin@movigo.com")
        print("   Password: admin123")
        print("   Role: admin")
        print("\n🌐 Để truy cập admin dashboard:")
        print("   1. Khởi động backend: uvicorn app.main:app --reload")
        print("   2. Khởi động frontend: npm run dev")  
        print("   3. Đăng nhập bằng tài khoản admin")
        print("   4. Truy cập: http://localhost:5173/admin")
        
    except Exception as e:
        print(f"❌ Lỗi: {e}")
    
    finally:
        await close_mongodb_connection()

if __name__ == "__main__":
    asyncio.run(create_admin_user()) 