from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import time
import logging
from typing import Callable
from ..services.admin_service import admin_service
from ..core.security import decode_access_token

"""
Admin Middleware
Middleware để logging và monitoring các hoạt động admin
"""

logger = logging.getLogger(__name__)

class AdminLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware log tất cả requests đến admin endpoints
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Chỉ log cho admin endpoints
        if not request.url.path.startswith("/api/v1/admin"):
            return await call_next(request)
        
        start_time = time.time()
        
        # Lấy thông tin client
        client_ip = self._get_client_ip(request)
        user_agent = request.headers.get("user-agent", "")
        
        # Lấy thông tin user từ token
        admin_email = None
        admin_id = None
        
        try:
            auth_header = request.headers.get("authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                payload = decode_access_token(token)
                if payload:
                    admin_email = payload.get("sub")
                    admin_id = payload.get("user_id")
        except Exception as e:
            logger.error(f"Error decoding token: {e}")
        
        # Thực hiện request
        response = await call_next(request)
        
        # Tính thời gian xử lý
        process_time = time.time() - start_time
        
        # Log request
        log_data = {
            "method": request.method,
            "path": request.url.path,
            "admin_email": admin_email,
            "admin_id": admin_id,
            "client_ip": client_ip,
            "user_agent": user_agent,
            "status_code": response.status_code,
            "process_time": round(process_time, 4),
            "query_params": str(request.query_params) if request.query_params else None
        }
        
        logger.info(f"Admin API Request: {log_data}")
        
        # Nếu là thao tác quan trọng, log vào database
        if self._is_critical_action(request.method, request.url.path) and admin_id:
            try:
                await self._log_critical_action(
                    admin_id, admin_email, request.method, 
                    request.url.path, client_ip, user_agent, response.status_code
                )
            except Exception as e:
                logger.error(f"Error logging critical action: {e}")
        
        return response
    
    def _get_client_ip(self, request: Request) -> str:
        """Lấy IP thực của client"""
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
        
        return request.client.host if request.client else "unknown"
    
    def _is_critical_action(self, method: str, path: str) -> bool:
        """Kiểm tra có phải hành động quan trọng cần log"""
        critical_patterns = [
            "/ban", "/unban", "/bulk-action", 
            "/moderation/", "/violations/", "/alerts/"
        ]
        
        if method in ["POST", "PUT", "DELETE"]:
            return any(pattern in path for pattern in critical_patterns)
        
        return False
    
    async def _log_critical_action(self, admin_id: str, admin_email: str, 
                                 method: str, path: str, ip: str, 
                                 user_agent: str, status_code: int):
        """Log hành động quan trọng vào database"""
        action_type = self._get_action_type(method, path)
        
        if action_type:
            await admin_service._log_admin_action(
                admin_id, admin_email, action_type, 
                "api_request", path, {
                    "method": method,
                    "status_code": status_code
                }, ip, user_agent
            )
    
    def _get_action_type(self, method: str, path: str) -> str:
        """Xác định loại hành động từ method và path"""
        if "/ban" in path:
            return "user_banned" if method == "POST" else "user_unbanned"
        elif "/moderation/" in path:
            return "content_moderated"
        elif "/violations/" in path:
            return "violation_handled"
        elif "/alerts/" in path:
            return "alert_managed"
        elif "/bulk-action" in path:
            return "bulk_operation"
        
        return "admin_action"

class SecurityMiddleware(BaseHTTPMiddleware):
    """
    Middleware bảo mật cho admin endpoints
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Chỉ áp dụng cho admin endpoints
        if not request.url.path.startswith("/api/v1/admin"):
            return await call_next(request)
        
        # Rate limiting check (cơ bản)
        client_ip = self._get_client_ip(request)
        if await self._is_rate_limited(client_ip):
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please try again later."}
            )
        
        # Security headers check
        if not self._validate_security_headers(request):
            logger.warning(f"Suspicious request from {client_ip}: {request.url.path}")
        
        response = await call_next(request)
        
        # Add security headers to response
        self._add_security_headers(response)
        
        return response
    
    def _get_client_ip(self, request: Request) -> str:
        """Lấy IP của client"""
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        return request.client.host if request.client else "unknown"
    
    async def _is_rate_limited(self, client_ip: str) -> bool:
        """Kiểm tra rate limiting (cơ bản)"""
        # Trong thực tế sẽ dùng Redis hoặc database để track
        # Hiện tại chỉ là mock implementation
        return False
    
    def _validate_security_headers(self, request: Request) -> bool:
        """Validate các security headers"""
        # Kiểm tra User-Agent
        user_agent = request.headers.get("user-agent", "")
        if not user_agent or len(user_agent) < 10:
            return False
        
        # Kiểm tra Authorization header format
        auth_header = request.headers.get("authorization", "")
        if auth_header and not auth_header.startswith("Bearer "):
            return False
        
        return True
    
    def _add_security_headers(self, response: Response):
        """Thêm security headers vào response"""
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

class AdminActivityMonitor:
    """
    Monitor hoạt động admin để phát hiện anomalies
    """
    
    @staticmethod
    async def detect_anomalies(admin_id: str, action: str) -> bool:
        """
        Phát hiện hoạt động bất thường
        """
        # Kiểm tra số lượng actions trong khoảng thời gian ngắn
        # Kiểm tra pattern hoạt động
        # Phát hiện bulk operations bất thường
        
        # Mock implementation
        return False
    
    @staticmethod
    async def create_security_alert(admin_id: str, activity_type: str, details: dict):
        """
        Tạo cảnh báo bảo mật
        """
        await admin_service.create_system_alert(
            alert_type="security",
            severity="high",
            title=f"Suspicious admin activity detected",
            message=f"Admin {admin_id} performed suspicious {activity_type}",
            metadata=details
        ) 