from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from bson import ObjectId
from enum import Enum

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, core_schema, handler):
        schema = handler(core_schema)
        schema.update(type="string")
        return schema

class ActionType(str, Enum):
    """Các loại hành động admin"""
    USER_BANNED = "user_banned"
    USER_UNBANNED = "user_unbanned"
    CONTENT_APPROVED = "content_approved"
    CONTENT_REJECTED = "content_rejected"
    CONTENT_REMOVED = "content_removed"
    SUBSCRIPTION_CHANGED = "subscription_changed"
    LOGIN_ADMIN = "login_admin"
    LOGOUT_ADMIN = "logout_admin"

class ModerationStatus(str, Enum):
    """Trạng thái kiểm duyệt"""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    FLAGGED = "flagged"

class ViolationType(str, Enum):
    """Loại vi phạm"""
    COPYRIGHT = "copyright"
    INAPPROPRIATE_CONTENT = "inappropriate_content"
    SPAM = "spam"
    ABUSE = "abuse"
    FRAUD = "fraud"
    OTHER = "other"

class AdminLogModel(BaseModel):
    """
    Model lưu trữ log hoạt động của admin
    """
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    admin_id: PyObjectId = Field(..., description="ID của admin thực hiện hành động")
    admin_email: str = Field(..., description="Email của admin")
    action: ActionType = Field(..., description="Loại hành động")
    target_type: str = Field(..., description="Loại đối tượng bị tác động (user, movie, comment)")
    target_id: PyObjectId = Field(..., description="ID của đối tượng bị tác động")
    details: Dict[str, Any] = Field(default_factory=dict, description="Chi tiết hành động")
    ip_address: Optional[str] = Field(None, description="Địa chỉ IP")
    user_agent: Optional[str] = Field(None, description="User agent")
    timestamp: datetime = Field(default_factory=datetime.now, description="Thời gian thực hiện")

    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class ContentModerationModel(BaseModel):
    """
    Model quản lý kiểm duyệt nội dung
    """
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    content_type: str = Field(..., description="Loại nội dung (movie, comment, profile)")
    content_id: PyObjectId = Field(..., description="ID nội dung")
    status: ModerationStatus = Field(default=ModerationStatus.PENDING, description="Trạng thái kiểm duyệt")
    moderator_id: Optional[PyObjectId] = Field(None, description="ID admin kiểm duyệt")
    moderator_email: Optional[str] = Field(None, description="Email admin kiểm duyệt")
    reason: Optional[str] = Field(None, description="Lý do từ chối/gỡ bỏ")
    notes: Optional[str] = Field(None, description="Ghi chú thêm")
    flagged_by: Optional[PyObjectId] = Field(None, description="ID người báo cáo")
    created_at: datetime = Field(default_factory=datetime.now, description="Thời gian tạo")
    moderated_at: Optional[datetime] = Field(None, description="Thời gian kiểm duyệt")

    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class ViolationReportModel(BaseModel):
    """
    Model báo cáo vi phạm
    """
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    reporter_id: PyObjectId = Field(..., description="ID người báo cáo")
    reporter_email: str = Field(..., description="Email người báo cáo")
    target_type: str = Field(..., description="Loại đối tượng bị báo cáo")
    target_id: PyObjectId = Field(..., description="ID đối tượng bị báo cáo")
    violation_type: ViolationType = Field(..., description="Loại vi phạm")
    description: str = Field(..., description="Mô tả chi tiết vi phạm")
    evidence_urls: List[str] = Field(default_factory=list, description="URL bằng chứng")
    status: str = Field(default="pending", description="Trạng thái xử lý (pending, investigating, resolved, dismissed)")
    assigned_admin: Optional[PyObjectId] = Field(None, description="Admin được phân công xử lý")
    resolution: Optional[str] = Field(None, description="Kết quả xử lý")
    created_at: datetime = Field(default_factory=datetime.now, description="Thời gian báo cáo")
    resolved_at: Optional[datetime] = Field(None, description="Thời gian giải quyết")

    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class SystemAlertModel(BaseModel):
    """
    Model cảnh báo hệ thống
    """
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    alert_type: str = Field(..., description="Loại cảnh báo (security, performance, content)")
    severity: str = Field(..., description="Mức độ nghiêm trọng (low, medium, high, critical)")
    title: str = Field(..., description="Tiêu đề cảnh báo")
    message: str = Field(..., description="Nội dung cảnh báo")
    source: str = Field(..., description="Nguồn cảnh báo (system, user_report, automated)")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Dữ liệu thêm")
    is_acknowledged: bool = Field(default=False, description="Đã xác nhận xử lý")
    acknowledged_by: Optional[PyObjectId] = Field(None, description="Admin xác nhận")
    created_at: datetime = Field(default_factory=datetime.now, description="Thời gian tạo")
    acknowledged_at: Optional[datetime] = Field(None, description="Thời gian xác nhận")

    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# MongoDB collection names
ADMIN_LOG_COLLECTION = "admin_logs"
CONTENT_MODERATION_COLLECTION = "content_moderation"
VIOLATION_REPORT_COLLECTION = "violation_reports"
SYSTEM_ALERT_COLLECTION = "system_alerts" 