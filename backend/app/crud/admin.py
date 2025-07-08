from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from bson import ObjectId
from pymongo import DESCENDING, ASCENDING
from ..db.database import get_database
from ..db.models.admin import (
    AdminLogModel, ContentModerationModel, ViolationReportModel, 
    SystemAlertModel, ActionType, ModerationStatus,
    ADMIN_LOG_COLLECTION, CONTENT_MODERATION_COLLECTION,
    VIOLATION_REPORT_COLLECTION, SYSTEM_ALERT_COLLECTION
)
from ..db.models.user import USER_COLLECTION
from ..db.models.movie import MOVIE_COLLECTION

"""
Admin CRUD Operations
Các operations CRUD cho admin functionality
"""

class AdminCRUD:
    def __init__(self):
        self.db = None
    
    async def get_db(self):
        if self.db is None:
            # Try to get existing db first
            from ..db.database import db, connect_to_mongodb
            if db is not None:
                self.db = db
            else:
                # If no existing connection, create new one
                self.db = await connect_to_mongodb()
        return self.db

    # Admin Logs
    async def create_admin_log(self, log_data: dict) -> str:
        """Tạo log hoạt động admin"""
        db = await self.get_db()
        result = await db[ADMIN_LOG_COLLECTION].insert_one(log_data)
        return str(result.inserted_id)

    async def get_admin_logs(self, skip: int = 0, limit: int = 50, 
                           admin_id: Optional[str] = None,
                           action: Optional[str] = None,
                           start_date: Optional[datetime] = None,
                           end_date: Optional[datetime] = None) -> List[dict]:
        """Lấy danh sách admin logs"""
        try:
            db = await self.get_db()
            
            # Kiểm tra database connection
            if db is None:
                return []
            
            # Kiểm tra collection có tồn tại không
            collections = await db.list_collection_names()
            if ADMIN_LOG_COLLECTION not in collections:
                return []
            
            query = {}
            if admin_id:
                query["admin_id"] = ObjectId(admin_id)
            if action:
                query["action"] = action
            if start_date or end_date:
                query["timestamp"] = {}
                if start_date:
                    query["timestamp"]["$gte"] = start_date
                if end_date:
                    query["timestamp"]["$lte"] = end_date
            
            cursor = db[ADMIN_LOG_COLLECTION].find(query).sort("timestamp", DESCENDING).skip(skip).limit(limit)
            return await cursor.to_list(length=limit)
            
        except Exception as e:
            print(f"Error in get_admin_logs: {e}")
            return []

    # Content Moderation
    async def create_moderation_request(self, moderation_data: dict) -> str:
        """Tạo yêu cầu kiểm duyệt"""
        db = await self.get_db()
        result = await db[CONTENT_MODERATION_COLLECTION].insert_one(moderation_data)
        return str(result.inserted_id)

    async def get_pending_moderations(self, content_type: Optional[str] = None,
                                    skip: int = 0, limit: int = 50) -> List[dict]:
        """Lấy danh sách nội dung chờ kiểm duyệt"""
        db = await self.get_db()
        
        query = {"status": ModerationStatus.PENDING}
        if content_type:
            query["content_type"] = content_type
        
        cursor = db[CONTENT_MODERATION_COLLECTION].find(query).sort("created_at", ASCENDING).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)

    async def update_moderation_status(self, moderation_id: str, 
                                     status: str, moderator_id: str, 
                                     moderator_email: str,
                                     reason: Optional[str] = None,
                                     notes: Optional[str] = None) -> bool:
        """Cập nhật trạng thái kiểm duyệt"""
        db = await self.get_db()
        
        update_data = {
            "status": status,
            "moderator_id": ObjectId(moderator_id),
            "moderator_email": moderator_email,
            "moderated_at": datetime.now()
        }
        
        if reason:
            update_data["reason"] = reason
        if notes:
            update_data["notes"] = notes
        
        result = await db[CONTENT_MODERATION_COLLECTION].update_one(
            {"_id": ObjectId(moderation_id)},
            {"$set": update_data}
        )
        return result.modified_count > 0

    # Violation Reports
    async def create_violation_report(self, report_data: dict) -> str:
        """Tạo báo cáo vi phạm"""
        db = await self.get_db()
        result = await db[VIOLATION_REPORT_COLLECTION].insert_one(report_data)
        return str(result.inserted_id)

    async def get_violation_reports(self, status: Optional[str] = None,
                                  violation_type: Optional[str] = None,
                                  assigned_admin: Optional[str] = None,
                                  skip: int = 0, limit: int = 50) -> List[dict]:
        """Lấy danh sách báo cáo vi phạm"""
        db = await self.get_db()
        
        query = {}
        if status:
            query["status"] = status
        if violation_type:
            query["violation_type"] = violation_type
        if assigned_admin:
            query["assigned_admin"] = ObjectId(assigned_admin)
        
        cursor = db[VIOLATION_REPORT_COLLECTION].find(query).sort("created_at", DESCENDING).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)

    async def assign_violation_report(self, report_id: str, admin_id: str) -> bool:
        """Phân công xử lý báo cáo vi phạm"""
        db = await self.get_db()
        
        result = await db[VIOLATION_REPORT_COLLECTION].update_one(
            {"_id": ObjectId(report_id)},
            {"$set": {
                "assigned_admin": ObjectId(admin_id),
                "status": "investigating"
            }}
        )
        return result.modified_count > 0

    async def resolve_violation_report(self, report_id: str, resolution: str) -> bool:
        """Giải quyết báo cáo vi phạm"""
        db = await self.get_db()
        
        result = await db[VIOLATION_REPORT_COLLECTION].update_one(
            {"_id": ObjectId(report_id)},
            {"$set": {
                "status": "resolved",
                "resolution": resolution,
                "resolved_at": datetime.now()
            }}
        )
        return result.modified_count > 0

    # System Alerts
    async def create_system_alert(self, alert_data: dict) -> str:
        """Tạo cảnh báo hệ thống"""
        db = await self.get_db()
        result = await db[SYSTEM_ALERT_COLLECTION].insert_one(alert_data)
        return str(result.inserted_id)

    async def get_system_alerts(self, severity: Optional[str] = None,
                              is_acknowledged: Optional[bool] = None,
                              skip: int = 0, limit: int = 50) -> List[dict]:
        """Lấy danh sách cảnh báo hệ thống"""
        try:
            db = await self.get_db()
            
            # Kiểm tra database connection
            if db is None:
                return []
            
            # Kiểm tra collection có tồn tại không
            collections = await db.list_collection_names()
            if SYSTEM_ALERT_COLLECTION not in collections:
                return []
            
            query = {}
            if severity:
                query["severity"] = severity
            if is_acknowledged is not None:
                query["is_acknowledged"] = is_acknowledged
            
            cursor = db[SYSTEM_ALERT_COLLECTION].find(query).sort("created_at", DESCENDING).skip(skip).limit(limit)
            return await cursor.to_list(length=limit)
            
        except Exception as e:
            print(f"Error in get_system_alerts: {e}")
            return []

    async def acknowledge_alert(self, alert_id: str, admin_id: str) -> bool:
        """Xác nhận đã xử lý cảnh báo"""
        db = await self.get_db()
        
        result = await db[SYSTEM_ALERT_COLLECTION].update_one(
            {"_id": ObjectId(alert_id)},
            {"$set": {
                "is_acknowledged": True,
                "acknowledged_by": ObjectId(admin_id),
                "acknowledged_at": datetime.now()
            }}
        )
        return result.modified_count > 0

    # User Management
    async def get_users_with_stats(self, email: Optional[str] = None,
                                 subscription_plan: Optional[str] = None,
                                 role: Optional[str] = None,
                                 is_active: Optional[bool] = None,
                                 skip: int = 0, limit: int = 50) -> List[dict]:
        """Lấy danh sách users với thống kê"""
        db = await self.get_db()
        
        query = {}
        if email:
            query["email"] = {"$regex": email, "$options": "i"}
        if subscription_plan:
            query["subscription_plan"] = subscription_plan
        if role:
            query["role"] = role
        if is_active is not None:
            query["is_active"] = is_active
        
        # Aggregation pipeline để lấy thống kê
        pipeline = [
            {"$match": query},
            {"$lookup": {
                "from": "watch_history",
                "localField": "_id",
                "foreignField": "user_id",
                "as": "watch_history"
            }},
            {"$lookup": {
                "from": "violation_reports",
                "localField": "_id",
                "foreignField": "target_id",
                "as": "violations"
            }},
            {"$addFields": {
                "total_watch_time": {"$sum": "$watch_history.watch_duration"},
                "violation_count": {"$size": "$violations"}
            }},
            {"$sort": {"created_at": -1}},
            {"$skip": skip},
            {"$limit": limit}
        ]
        
        cursor = db[USER_COLLECTION].aggregate(pipeline)
        return await cursor.to_list(length=limit)

    async def update_user_status(self, user_id: str, update_data: dict) -> bool:
        """Cập nhật trạng thái user"""
        db = await self.get_db()
        
        update_data["updated_at"] = datetime.now()
        
        result = await db[USER_COLLECTION].update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        return result.modified_count > 0

    async def ban_user(self, user_id: str, admin_id: str, reason: str) -> bool:
        """Cấm user"""
        db = await self.get_db()
        
        # Cập nhật trạng thái user
        result = await db[USER_COLLECTION].update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {
                "is_active": False,
                "updated_at": datetime.now()
            }}
        )
        
        # Tạo log admin
        if result.modified_count > 0:
            log_data = {
                "admin_id": ObjectId(admin_id),
                "action": ActionType.USER_BANNED,
                "target_type": "user",
                "target_id": ObjectId(user_id),
                "details": {"reason": reason},
                "timestamp": datetime.now()
            }
            await self.create_admin_log(log_data)
        
        return result.modified_count > 0

    # Dashboard Stats
    async def get_dashboard_stats(self) -> dict:
        """Lấy thống kê dashboard"""
        try:
            db = await self.get_db()
            
            # Kiểm tra xem database có kết nối không
            if db is None:
                # Trả về mock data khi không có database
                return {
                    "total_users": 0,
                    "active_users": 0,
                    "new_users_today": 0,
                    "total_movies": 0,
                    "total_views": 0,
                    "pending_reports": 0,
                    "system_alerts": 0,
                    "revenue_today": 0.0,
                    "top_genres": [],
                    "recent_activities": []
                }
            
            # Tính toán các thống kê
            total_users = 0
            active_users = 0
            new_users_today = 0
            total_movies = 0
            total_views = 0
            pending_reports = 0
            system_alerts = 0
            top_genres = []
            
            try:
                # Kiểm tra collection users có tồn tại không
                collections = await db.list_collection_names()
                
                if USER_COLLECTION in collections:
                    total_users = await db[USER_COLLECTION].count_documents({})
                    active_users = await db[USER_COLLECTION].count_documents({"is_active": True})
                    
                    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
                    new_users_today = await db[USER_COLLECTION].count_documents({
                        "created_at": {"$gte": today}
                    })
                
                if MOVIE_COLLECTION in collections:
                    total_movies = await db[MOVIE_COLLECTION].count_documents({})
                    
                    # Tính tổng views từ tất cả movies
                    pipeline = [{"$group": {"_id": None, "total": {"$sum": "$view_count"}}}]
                    view_result = await db[MOVIE_COLLECTION].aggregate(pipeline).to_list(1)
                    total_views = view_result[0]["total"] if view_result else 0
                    
                    # Top genres
                    genre_pipeline = [
                        {"$unwind": "$genres"},
                        {"$group": {"_id": "$genres", "count": {"$sum": 1}}},
                        {"$sort": {"count": -1}},
                        {"$limit": 5}
                    ]
                    top_genres_result = await db[MOVIE_COLLECTION].aggregate(genre_pipeline).to_list(5)
                    top_genres = [{"genre": g["_id"], "count": g["count"]} for g in top_genres_result]
                
                if VIOLATION_REPORT_COLLECTION in collections:
                    pending_reports = await db[VIOLATION_REPORT_COLLECTION].count_documents({
                        "status": "pending"
                    })
                
                if SYSTEM_ALERT_COLLECTION in collections:
                    system_alerts = await db[SYSTEM_ALERT_COLLECTION].count_documents({
                        "is_acknowledged": False
                    })
                    
            except Exception as e:
                # Log lỗi nhưng không crash
                print(f"Error querying collections: {e}")
            
            return {
                "total_users": total_users,
                "active_users": active_users,
                "new_users_today": new_users_today,
                "total_movies": total_movies,
                "total_views": total_views,
                "pending_reports": pending_reports,
                "system_alerts": system_alerts,
                "revenue_today": 0.0,  # Mock data
                "top_genres": top_genres,
                "recent_activities": []  # Sẽ được implement sau
            }
            
        except Exception as e:
            # Nếu có lỗi nghiêm trọng, trả về mock data
            print(f"Critical error in get_dashboard_stats: {e}")
            return {
                "total_users": 0,
                "active_users": 0,
                "new_users_today": 0,
                "total_movies": 0,
                "total_views": 0,
                "pending_reports": 0,
                "system_alerts": 0,
                "revenue_today": 0.0,
                "top_genres": [],
                "recent_activities": []
            }

# Global instance
admin_crud = AdminCRUD() 