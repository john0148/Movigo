from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from bson import ObjectId

from ..crud.admin import admin_crud
from ..crud.user import get_user_by_id
from ..crud.movie import get_movie_by_id
from ..db.models.admin import ActionType, ModerationStatus, ViolationType

"""
Admin Service Layer
Xử lý logic nghiệp vụ cho admin functionality
"""

class AdminService:
    
    def __init__(self):
        self.crud = admin_crud

    # Dashboard và Analytics
    async def get_dashboard_statistics(self) -> Dict[str, Any]:
        """Lấy thống kê tổng quan cho dashboard"""
        stats = await self.crud.get_dashboard_stats()
        
        # Thêm các thống kê real-time
        stats["recent_activities"] = await self._get_recent_activities()
        
        return stats

    async def _get_recent_activities(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Lấy hoạt động gần đây"""
        logs = await self.crud.get_admin_logs(limit=limit)
        activities = []
        
        for log in logs:
            activities.append({
                "timestamp": log["timestamp"],
                "admin_email": log.get("admin_email", "System"),
                "action": log["action"],
                "target_type": log["target_type"],
                "details": log.get("details", {})
            })
        
        return activities

    async def get_analytics_data(self, metric_type: str, start_date: datetime, 
                               end_date: datetime, granularity: str = "day") -> Dict[str, Any]:
        """Lấy dữ liệu phân tích theo thời gian"""
        
        if metric_type == "users":
            return await self._get_user_analytics(start_date, end_date, granularity)
        elif metric_type == "content":
            return await self._get_content_analytics(start_date, end_date, granularity)
        elif metric_type == "revenue":
            return await self._get_revenue_analytics(start_date, end_date, granularity)
        elif metric_type == "performance":
            return await self._get_performance_analytics(start_date, end_date, granularity)
        else:
            raise ValueError(f"Unknown metric type: {metric_type}")

    async def _get_user_analytics(self, start_date: datetime, end_date: datetime, 
                                granularity: str) -> Dict[str, Any]:
        """Phân tích người dùng"""
        # Mock implementation - trong thực tế sẽ query database
        data_points = []
        current = start_date
        
        while current <= end_date:
            data_points.append({
                "date": current.isoformat(),
                "new_users": 15,  # Mock data
                "active_users": 120,
                "churned_users": 3
            })
            
            if granularity == "hour":
                current += timedelta(hours=1)
            elif granularity == "day":
                current += timedelta(days=1)
            elif granularity == "week":
                current += timedelta(weeks=1)
            elif granularity == "month":
                current += timedelta(days=30)
        
        return {
            "metric_type": "users",
            "data_points": data_points,
            "summary": {
                "total_new_users": len(data_points) * 15,
                "avg_daily_active": 120,
                "churn_rate": 2.5
            },
            "period": {"start": start_date, "end": end_date}
        }

    async def _get_content_analytics(self, start_date: datetime, end_date: datetime, 
                                   granularity: str) -> Dict[str, Any]:
        """Phân tích nội dung"""
        data_points = []
        current = start_date
        
        while current <= end_date:
            data_points.append({
                "date": current.isoformat(),
                "new_content": 5,
                "views": 1500,
                "ratings": 45
            })
            
            if granularity == "day":
                current += timedelta(days=1)
            elif granularity == "week":
                current += timedelta(weeks=1)
            elif granularity == "month":
                current += timedelta(days=30)
        
        return {
            "metric_type": "content",
            "data_points": data_points,
            "summary": {
                "total_content": len(data_points) * 5,
                "total_views": len(data_points) * 1500,
                "avg_rating": 4.2
            },
            "period": {"start": start_date, "end": end_date}
        }

    async def _get_revenue_analytics(self, start_date: datetime, end_date: datetime, 
                                   granularity: str) -> Dict[str, Any]:
        """Phân tích doanh thu"""
        data_points = []
        current = start_date
        
        while current <= end_date:
            data_points.append({
                "date": current.isoformat(),
                "revenue": 1250.0,  # Mock data
                "subscriptions": 45,
                "upgrades": 12
            })
            
            if granularity == "day":
                current += timedelta(days=1)
            elif granularity == "week":
                current += timedelta(weeks=1)
            elif granularity == "month":
                current += timedelta(days=30)
        
        return {
            "metric_type": "revenue",
            "data_points": data_points,
            "summary": {
                "total_revenue": len(data_points) * 1250.0,
                "avg_daily_revenue": 1250.0,
                "growth_rate": 8.5
            },
            "period": {"start": start_date, "end": end_date}
        }

    async def _get_performance_analytics(self, start_date: datetime, end_date: datetime, 
                                       granularity: str) -> Dict[str, Any]:
        """Phân tích hiệu suất hệ thống"""
        data_points = []
        current = start_date
        
        while current <= end_date:
            data_points.append({
                "date": current.isoformat(),
                "response_time": 150,  # milliseconds
                "uptime": 99.9,       # percentage
                "errors": 5
            })
            
            if granularity == "day":
                current += timedelta(days=1)
            elif granularity == "week":
                current += timedelta(weeks=1)
            elif granularity == "month":
                current += timedelta(days=30)
        
        return {
            "metric_type": "performance",
            "data_points": data_points,
            "summary": {
                "avg_response_time": 150,
                "avg_uptime": 99.9,
                "total_errors": len(data_points) * 5
            },
            "period": {"start": start_date, "end": end_date}
        }

    # Content Moderation
    async def get_moderation_queue(self, content_type: Optional[str] = None,
                                 page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """Lấy hàng đợi kiểm duyệt"""
        skip = (page - 1) * limit
        moderations = await self.crud.get_pending_moderations(content_type, skip, limit)
        
        # Thêm thông tin chi tiết của content
        enriched_moderations = []
        for mod in moderations:
            content_details = await self._get_content_details(
                mod["content_type"], mod["content_id"]
            )
            mod["content_details"] = content_details
            enriched_moderations.append(mod)
        
        return {
            "items": enriched_moderations,
            "page": page,
            "limit": limit,
            "total": len(enriched_moderations)  # Trong thực tế sẽ count từ DB
        }

    async def _get_content_details(self, content_type: str, content_id: ObjectId) -> Dict[str, Any]:
        """Lấy chi tiết nội dung cần kiểm duyệt"""
        if content_type == "movie":
            movie = await get_movie_by_id(str(content_id))
            return {
                "title": movie.get("title", ""),
                "overview": movie.get("overview", ""),
                "poster_url": movie.get("poster_url", "")
            } if movie else {}
        elif content_type == "user":
            user = await get_user_by_id(str(content_id))
            return {
                "email": user.get("email", ""),
                "full_name": user.get("full_name", ""),
                "avatar_url": user.get("avatar_url", "")
            } if user else {}
        
        return {}

    async def moderate_content(self, moderation_id: str, admin_id: str, admin_email: str,
                             status: str, reason: Optional[str] = None, 
                             notes: Optional[str] = None) -> bool:
        """Kiểm duyệt nội dung"""
        success = await self.crud.update_moderation_status(
            moderation_id, status, admin_id, admin_email, reason, notes
        )
        
        if success:
            # Log hoạt động admin
            action = ActionType.CONTENT_APPROVED if status == "approved" else ActionType.CONTENT_REJECTED
            await self._log_admin_action(admin_id, admin_email, action, "moderation", moderation_id, {
                "status": status,
                "reason": reason,
                "notes": notes
            })
        
        return success

    # User Management
    async def get_users_management(self, search_params: Dict[str, Any]) -> Dict[str, Any]:
        """Lấy danh sách users để quản lý"""
        page = search_params.get("page", 1)
        limit = search_params.get("limit", 20)
        skip = (page - 1) * limit
        
        users = await self.crud.get_users_with_stats(
            email=search_params.get("email"),
            subscription_plan=search_params.get("subscription_plan"),
            role=search_params.get("role"),
            is_active=search_params.get("is_active"),
            skip=skip,
            limit=limit
        )
        
        return {
            "items": users,
            "page": page,
            "limit": limit,
            "total": len(users)
        }

    async def update_user(self, user_id: str, admin_id: str, admin_email: str,
                        update_data: Dict[str, Any]) -> bool:
        """Cập nhật thông tin user"""
        success = await self.crud.update_user_status(user_id, update_data)
        
        if success:
            # Log hoạt động admin
            await self._log_admin_action(admin_id, admin_email, ActionType.SUBSCRIPTION_CHANGED, 
                                       "user", user_id, update_data)
        
        return success

    async def ban_user(self, user_id: str, admin_id: str, admin_email: str, reason: str) -> bool:
        """Cấm user"""
        success = await self.crud.ban_user(user_id, admin_id, reason)
        
        if success:
            await self._log_admin_action(admin_id, admin_email, ActionType.USER_BANNED, 
                                       "user", user_id, {"reason": reason})
        
        return success

    # Violation Reports
    async def get_violation_reports(self, filters: Dict[str, Any]) -> Dict[str, Any]:
        """Lấy danh sách báo cáo vi phạm"""
        page = filters.get("page", 1)
        limit = filters.get("limit", 20)
        skip = (page - 1) * limit
        
        reports = await self.crud.get_violation_reports(
            status=filters.get("status"),
            violation_type=filters.get("violation_type"),
            assigned_admin=filters.get("assigned_admin"),
            skip=skip,
            limit=limit
        )
        
        return {
            "items": reports,
            "page": page,
            "limit": limit,
            "total": len(reports)
        }

    async def assign_violation_report(self, report_id: str, admin_id: str, admin_email: str) -> bool:
        """Phân công xử lý báo cáo vi phạm"""
        success = await self.crud.assign_violation_report(report_id, admin_id)
        
        if success:
            await self._log_admin_action(admin_id, admin_email, "violation_assigned", 
                                       "violation_report", report_id, {})
        
        return success

    async def resolve_violation_report(self, report_id: str, admin_id: str, admin_email: str,
                                     resolution: str) -> bool:
        """Giải quyết báo cáo vi phạm"""
        success = await self.crud.resolve_violation_report(report_id, resolution)
        
        if success:
            await self._log_admin_action(admin_id, admin_email, "violation_resolved", 
                                       "violation_report", report_id, {"resolution": resolution})
        
        return success

    # System Alerts
    async def get_system_alerts(self, severity: Optional[str] = None,
                              is_acknowledged: Optional[bool] = None) -> List[Dict[str, Any]]:
        """Lấy cảnh báo hệ thống"""
        return await self.crud.get_system_alerts(severity, is_acknowledged)

    async def create_system_alert(self, alert_type: str, severity: str, title: str,
                                message: str, metadata: Dict[str, Any] = None) -> str:
        """Tạo cảnh báo hệ thống"""
        alert_data = {
            "alert_type": alert_type,
            "severity": severity,
            "title": title,
            "message": message,
            "source": "system",
            "metadata": metadata or {},
            "is_acknowledged": False,
            "created_at": datetime.now()
        }
        
        return await self.crud.create_system_alert(alert_data)

    async def acknowledge_alert(self, alert_id: str, admin_id: str, admin_email: str) -> bool:
        """Xác nhận đã xử lý cảnh báo"""
        success = await self.crud.acknowledge_alert(alert_id, admin_id)
        
        if success:
            await self._log_admin_action(admin_id, admin_email, "alert_acknowledged", 
                                       "system_alert", alert_id, {})
        
        return success

    # Monitoring và Security
    async def detect_suspicious_activity(self) -> List[Dict[str, Any]]:
        """Phát hiện hoạt động đáng ngờ"""
        suspicious_activities = []
        
        # Kiểm tra users có nhiều thiết bị đăng nhập
        # Kiểm tra users xem quá nhiều nội dung trong thời gian ngắn
        # Kiểm tra patterns bất thường
        
        # Mock implementation
        suspicious_activities.append({
            "type": "multiple_devices",
            "user_id": "mock_user_id",
            "description": "User đăng nhập trên 5 thiết bị khác nhau trong 1 giờ",
            "severity": "medium",
            "detected_at": datetime.now()
        })
        
        return suspicious_activities

    # Utility Methods
    async def _log_admin_action(self, admin_id: str, admin_email: str, action: str,
                              target_type: str, target_id: str, details: Dict[str, Any],
                              ip_address: Optional[str] = None, user_agent: Optional[str] = None):
        """Log hoạt động admin"""
        log_data = {
            "admin_id": ObjectId(admin_id),
            "admin_email": admin_email,
            "action": action,
            "target_type": target_type,
            "target_id": ObjectId(target_id),
            "details": details,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "timestamp": datetime.now()
        }
        
        await self.crud.create_admin_log(log_data)

    async def get_admin_logs(self, filters: Dict[str, Any]) -> Dict[str, Any]:
        """Lấy logs hoạt động admin"""
        page = filters.get("page", 1)
        limit = filters.get("limit", 50)
        skip = (page - 1) * limit
        
        logs = await self.crud.get_admin_logs(
            skip=skip,
            limit=limit,
            admin_id=filters.get("admin_id"),
            action=filters.get("action"),
            start_date=filters.get("start_date"),
            end_date=filters.get("end_date")
        )
        
        return {
            "items": logs,
            "page": page,
            "limit": limit,
            "total": len(logs)
        }

# Global instance
admin_service = AdminService() 