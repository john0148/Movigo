from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

# Dashboard Schemas
class DashboardStatsOut(BaseModel):
    """Schema cho thống kê dashboard"""
    total_users: int
    active_users: int
    new_users_today: int
    total_movies: int
    total_views: int
    pending_reports: int
    system_alerts: int
    revenue_today: float
    top_genres: List[Dict[str, Any]]
    recent_activities: List[Dict[str, Any]]

class UserActivityOut(BaseModel):
    """Schema hoạt động người dùng"""
    user_id: str
    email: str
    last_login: Optional[datetime]
    watch_time_today: int
    devices_count: int
    subscription_plan: str
    is_active: bool

# Content Moderation Schemas
class ContentModerationIn(BaseModel):
    """Schema input kiểm duyệt nội dung"""
    status: str = Field(..., description="approved, rejected, flagged")
    reason: Optional[str] = Field(None, description="Lý do từ chối")
    notes: Optional[str] = Field(None, description="Ghi chú")

class ContentModerationOut(BaseModel):
    """Schema output kiểm duyệt nội dung"""
    id: str
    content_type: str
    content_id: str
    status: str
    moderator_email: Optional[str]
    reason: Optional[str]
    notes: Optional[str]
    created_at: datetime
    moderated_at: Optional[datetime]
    content_details: Optional[Dict[str, Any]]

# User Management Schemas
class UserManagementIn(BaseModel):
    """Schema input quản lý người dùng"""
    is_active: Optional[bool] = None
    subscription_plan: Optional[str] = None
    max_devices: Optional[int] = None
    role: Optional[str] = None

class UserManagementOut(BaseModel):
    """Schema output quản lý người dùng"""
    id: str
    email: str
    full_name: Optional[str]
    subscription_plan: str
    max_devices: int
    role: str
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime]
    total_watch_time: int
    violation_count: int

# Violation Report Schemas
class ViolationReportIn(BaseModel):
    """Schema input báo cáo vi phạm"""
    target_type: str = Field(..., description="user, movie, comment")
    target_id: str
    violation_type: str
    description: str
    evidence_urls: List[str] = Field(default_factory=list)

class ViolationReportOut(BaseModel):
    """Schema output báo cáo vi phạm"""
    id: str
    reporter_email: str
    target_type: str
    target_id: str
    violation_type: str
    description: str
    evidence_urls: List[str]
    status: str
    assigned_admin: Optional[str]
    resolution: Optional[str]
    created_at: datetime
    resolved_at: Optional[datetime]

class ViolationActionIn(BaseModel):
    """Schema action xử lý vi phạm"""
    status: str = Field(..., description="investigating, resolved, dismissed")
    resolution: Optional[str] = None

# System Alert Schemas
class SystemAlertIn(BaseModel):
    """Schema input cảnh báo hệ thống"""
    alert_type: str
    severity: str = Field(..., description="low, medium, high, critical")
    title: str
    message: str
    source: str = Field(default="system")
    metadata: Dict[str, Any] = Field(default_factory=dict)

class SystemAlertOut(BaseModel):
    """Schema output cảnh báo hệ thống"""
    id: str
    alert_type: str
    severity: str
    title: str
    message: str
    source: str
    metadata: Dict[str, Any]
    is_acknowledged: bool
    acknowledged_by: Optional[str]
    created_at: datetime
    acknowledged_at: Optional[datetime]

# Analytics Schemas
class AnalyticsQuery(BaseModel):
    """Schema query analytics"""
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    metric_type: str = Field(..., description="users, content, revenue, performance")
    granularity: str = Field(default="day", description="hour, day, week, month")

class AnalyticsOut(BaseModel):
    """Schema output analytics"""
    metric_type: str
    data_points: List[Dict[str, Any]]
    summary: Dict[str, Any]
    period: Dict[str, datetime]

# Admin Log Schemas
class AdminLogOut(BaseModel):
    """Schema output admin logs"""
    id: str
    admin_email: str
    action: str
    target_type: str
    target_id: str
    details: Dict[str, Any]
    ip_address: Optional[str]
    timestamp: datetime

# Search và Filter Schemas
class UserSearchQuery(BaseModel):
    """Schema tìm kiếm người dùng"""
    email: Optional[str] = None
    subscription_plan: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)

class ContentSearchQuery(BaseModel):
    """Schema tìm kiếm nội dung"""
    title: Optional[str] = None
    genre: Optional[str] = None
    status: Optional[str] = None
    moderated_after: Optional[datetime] = None
    moderated_before: Optional[datetime] = None
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)

# Bulk Operations Schemas
class BulkUserAction(BaseModel):
    """Schema hành động bulk cho users"""
    user_ids: List[str]
    action: str = Field(..., description="ban, unban, change_subscription, delete")
    parameters: Dict[str, Any] = Field(default_factory=dict)

class BulkContentAction(BaseModel):
    """Schema hành động bulk cho content"""
    content_ids: List[str]
    action: str = Field(..., description="approve, reject, remove")
    reason: Optional[str] = None 