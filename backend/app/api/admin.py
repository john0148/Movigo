from fastapi import APIRouter, Depends, HTTPException, Query, Request
from typing import Optional, List
from datetime import datetime

from ..schemas.admin import (
    DashboardStatsOut, ContentModerationIn, ContentModerationOut,
    UserManagementIn, UserManagementOut, ViolationReportIn, ViolationReportOut,
    ViolationActionIn, SystemAlertIn, SystemAlertOut, AnalyticsQuery, AnalyticsOut,
    AdminLogOut, UserSearchQuery, ContentSearchQuery, BulkUserAction, BulkContentAction
)
from ..services.admin_service import admin_service
from ..dependencies import get_current_user
from ..schemas.user import UserInDB

"""
Admin API Router
Các endpoints cho admin panel:
- Dashboard thống kê
- Quản lý người dùng
- Kiểm duyệt nội dung
- Xử lý báo cáo vi phạm
- Cảnh báo hệ thống
- Analytics và báo cáo
"""

router = APIRouter(prefix="/admin", tags=["admin"])

def require_admin(current_user: UserInDB = Depends(get_current_user)):
    """Middleware kiểm tra quyền admin"""
    if getattr(current_user, 'role', 'user') != "admin":
        raise HTTPException(status_code=403, detail="Chỉ admin mới có quyền truy cập")
    return current_user

# Dashboard Endpoints
@router.get("/dashboard", response_model=DashboardStatsOut)
async def get_dashboard_stats(admin_user: UserInDB = Depends(require_admin)):
    """
    Lấy thống kê tổng quan cho dashboard admin
    """
    stats = await admin_service.get_dashboard_statistics()
    return stats

@router.get("/analytics", response_model=AnalyticsOut)
async def get_analytics(
    query: AnalyticsQuery = Depends(),
    admin_user: UserInDB = Depends(require_admin)
):
    """
    Lấy dữ liệu phân tích theo thời gian
    """
    start_date = query.start_date or datetime.now().replace(day=1)  # Đầu tháng
    end_date = query.end_date or datetime.now()
    
    analytics = await admin_service.get_analytics_data(
        query.metric_type, start_date, end_date, query.granularity
    )
    return analytics

# User Management Endpoints
@router.get("/users", response_model=List[UserManagementOut])
async def get_users(
    search: UserSearchQuery = Depends(),
    admin_user: UserInDB = Depends(require_admin)
):
    """
    Lấy danh sách users để quản lý
    """
    search_params = search.dict(exclude_unset=True)
    result = await admin_service.get_users_management(search_params)
    return result["items"]

@router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    update_data: UserManagementIn,
    request: Request,
    admin_user: UserInDB = Depends(require_admin)
):
    """
    Cập nhật thông tin user
    """
    update_dict = update_data.dict(exclude_unset=True)
    if not update_dict:
        raise HTTPException(status_code=400, detail="Không có dữ liệu để cập nhật")
    
    success = await admin_service.update_user(
        user_id, str(admin_user.id), admin_user.email, update_dict
    )
    
    if not success:
        raise HTTPException(status_code=404, detail="Không tìm thấy user")
    
    return {"success": True, "message": "Cập nhật user thành công"}

@router.post("/users/{user_id}/ban")
async def ban_user(
    user_id: str,
    reason: str = Query(..., description="Lý do cấm user"),
    admin_user: UserInDB = Depends(require_admin)
):
    """
    Cấm user
    """
    success = await admin_service.ban_user(
        user_id, str(admin_user.id), admin_user.email, reason
    )
    
    if not success:
        raise HTTPException(status_code=404, detail="Không tìm thấy user")
    
    return {"success": True, "message": "Đã cấm user thành công"}

@router.post("/users/{user_id}/unban")
async def unban_user(
    user_id: str,
    admin_user: UserInDB = Depends(require_admin)
):
    """
    Bỏ cấm user
    """
    success = await admin_service.update_user(
        user_id, str(admin_user.id), admin_user.email, {"is_active": True}
    )
    
    if not success:
        raise HTTPException(status_code=404, detail="Không tìm thấy user")
    
    return {"success": True, "message": "Đã bỏ cấm user thành công"}

@router.post("/users/bulk-action")
async def bulk_user_action(
    action_data: BulkUserAction,
    admin_user: UserInDB = Depends(require_admin)
):
    """
    Thực hiện hành động hàng loạt cho users
    """
    # Implementation cho bulk actions
    # Ban, unban, change subscription, delete users
    success_count = 0
    errors = []
    
    for user_id in action_data.user_ids:
        try:
            if action_data.action == "ban":
                reason = action_data.parameters.get("reason", "Bulk ban action")
                await admin_service.ban_user(user_id, str(admin_user.id), admin_user.email, reason)
            elif action_data.action == "unban":
                await admin_service.update_user(user_id, str(admin_user.id), admin_user.email, {"is_active": True})
            elif action_data.action == "change_subscription":
                plan = action_data.parameters.get("subscription_plan")
                if plan:
                    await admin_service.update_user(user_id, str(admin_user.id), admin_user.email, {"subscription_plan": plan})
            
            success_count += 1
        except Exception as e:
            errors.append({"user_id": user_id, "error": str(e)})
    
    return {
        "success": True,
        "processed": len(action_data.user_ids),
        "successful": success_count,
        "errors": errors
    }

# Content Moderation Endpoints
@router.get("/moderation/queue", response_model=List[ContentModerationOut])
async def get_moderation_queue(
    content_type: Optional[str] = Query(None, description="Loại nội dung (movie, user, comment)"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    admin_user: UserInDB = Depends(require_admin)
):
    """
    Lấy hàng đợi kiểm duyệt nội dung
    """
    result = await admin_service.get_moderation_queue(content_type, page, limit)
    return result["items"]

@router.put("/moderation/{moderation_id}")
async def moderate_content(
    moderation_id: str,
    moderation_data: ContentModerationIn,
    admin_user: UserInDB = Depends(require_admin)
):
    """
    Thực hiện kiểm duyệt nội dung
    """
    success = await admin_service.moderate_content(
        moderation_id, str(admin_user.id), admin_user.email,
        moderation_data.status, moderation_data.reason, moderation_data.notes
    )
    
    if not success:
        raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu kiểm duyệt")
    
    return {"success": True, "message": "Kiểm duyệt nội dung thành công"}

@router.post("/moderation/bulk-action")
async def bulk_content_action(
    action_data: BulkContentAction,
    admin_user: UserInDB = Depends(require_admin)
):
    """
    Thực hiện hành động hàng loạt cho nội dung
    """
    success_count = 0
    errors = []
    
    for content_id in action_data.content_ids:
        try:
            await admin_service.moderate_content(
                content_id, str(admin_user.id), admin_user.email,
                action_data.action, action_data.reason
            )
            success_count += 1
        except Exception as e:
            errors.append({"content_id": content_id, "error": str(e)})
    
    return {
        "success": True,
        "processed": len(action_data.content_ids),
        "successful": success_count,
        "errors": errors
    }

# Violation Reports Endpoints
@router.get("/violations", response_model=List[ViolationReportOut])
async def get_violation_reports(
    status: Optional[str] = Query(None, description="Trạng thái (pending, investigating, resolved, dismissed)"),
    violation_type: Optional[str] = Query(None, description="Loại vi phạm"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    admin_user: UserInDB = Depends(require_admin)
):
    """
    Lấy danh sách báo cáo vi phạm
    """
    filters = {
        "status": status,
        "violation_type": violation_type,
        "page": page,
        "limit": limit
    }
    result = await admin_service.get_violation_reports(filters)
    return result["items"]

@router.post("/violations/{report_id}/assign")
async def assign_violation_report(
    report_id: str,
    admin_user: UserInDB = Depends(require_admin)
):
    """
    Tự phân công xử lý báo cáo vi phạm
    """
    success = await admin_service.assign_violation_report(
        report_id, str(admin_user.id), admin_user.email
    )
    
    if not success:
        raise HTTPException(status_code=404, detail="Không tìm thấy báo cáo vi phạm")
    
    return {"success": True, "message": "Đã phân công xử lý báo cáo"}

@router.put("/violations/{report_id}/resolve")
async def resolve_violation_report(
    report_id: str,
    action_data: ViolationActionIn,
    admin_user: UserInDB = Depends(require_admin)
):
    """
    Giải quyết báo cáo vi phạm
    """
    success = await admin_service.resolve_violation_report(
        report_id, str(admin_user.id), admin_user.email, action_data.resolution or "Resolved"
    )
    
    if not success:
        raise HTTPException(status_code=404, detail="Không tìm thấy báo cáo vi phạm")
    
    return {"success": True, "message": "Đã giải quyết báo cáo vi phạm"}

# System Alerts Endpoints
@router.get("/alerts", response_model=List[SystemAlertOut])
async def get_system_alerts(
    severity: Optional[str] = Query(None, description="Mức độ nghiêm trọng (low, medium, high, critical)"),
    acknowledged: Optional[bool] = Query(None, description="Đã xác nhận hay chưa"),
    admin_user: UserInDB = Depends(require_admin)
):
    """
    Lấy danh sách cảnh báo hệ thống
    """
    alerts = await admin_service.get_system_alerts(severity, acknowledged)
    return alerts

@router.post("/alerts", response_model=dict)
async def create_system_alert(
    alert_data: SystemAlertIn,
    admin_user: UserInDB = Depends(require_admin)
):
    """
    Tạo cảnh báo hệ thống mới
    """
    alert_id = await admin_service.create_system_alert(
        alert_data.alert_type, alert_data.severity, alert_data.title,
        alert_data.message, alert_data.metadata
    )
    
    return {"success": True, "alert_id": alert_id, "message": "Đã tạo cảnh báo hệ thống"}

@router.put("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: str,
    admin_user: UserInDB = Depends(require_admin)
):
    """
    Xác nhận đã xử lý cảnh báo
    """
    success = await admin_service.acknowledge_alert(
        alert_id, str(admin_user.id), admin_user.email
    )
    
    if not success:
        raise HTTPException(status_code=404, detail="Không tìm thấy cảnh báo")
    
    return {"success": True, "message": "Đã xác nhận cảnh báo"}

# Admin Logs Endpoints
@router.get("/logs", response_model=List[AdminLogOut])
async def get_admin_logs(
    admin_id: Optional[str] = Query(None, description="ID admin"),
    action: Optional[str] = Query(None, description="Loại hành động"),
    start_date: Optional[datetime] = Query(None, description="Từ ngày"),
    end_date: Optional[datetime] = Query(None, description="Đến ngày"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    admin_user: UserInDB = Depends(require_admin)
):
    """
    Lấy logs hoạt động admin
    """
    filters = {
        "admin_id": admin_id,
        "action": action,
        "start_date": start_date,
        "end_date": end_date,
        "page": page,
        "limit": limit
    }
    result = await admin_service.get_admin_logs(filters)
    return result["items"]

# Security và Monitoring
@router.get("/security/suspicious-activities")
async def get_suspicious_activities(admin_user: UserInDB = Depends(require_admin)):
    """
    Lấy danh sách hoạt động đáng ngờ
    """
    activities = await admin_service.detect_suspicious_activity()
    return {"activities": activities}

# Content Search
@router.get("/content/search")
async def search_content(
    search: ContentSearchQuery = Depends(),
    admin_user: UserInDB = Depends(require_admin)
):
    """
    Tìm kiếm nội dung để quản lý
    """
    # Implementation tìm kiếm nội dung
    # Trong thực tế sẽ tích hợp với movie service
    return {
        "items": [],
        "page": search.page,
        "limit": search.limit,
        "total": 0
    } 