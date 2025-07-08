import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from bson import ObjectId
import logging

from ..crud.admin import admin_crud
from ..crud.user import get_all_users
from ..crud.movie import get_all_movies
from ..services.admin_service import admin_service

"""
Notification Service
Hệ thống thông báo và cảnh báo tự động cho admin
"""

logger = logging.getLogger(__name__)

class NotificationService:
    """
    Service quản lý thông báo và cảnh báo tự động
    """
    
    def __init__(self):
        self.monitoring_tasks = {}
        self.alert_thresholds = {
            'user_registration_spike': 50,  # Số user đăng ký bất thường trong 1 giờ
            'multiple_device_login': 5,     # Số thiết bị đăng nhập cùng lúc
            'high_error_rate': 10,          # Số lỗi trong 5 phút
            'suspicious_activity': 3,       # Số hoạt động đáng ngờ
            'content_violation_spike': 20,  # Số báo cáo vi phạm trong 1 giờ
        }

    async def start_monitoring(self):
        """Bắt đầu giám sát hệ thống"""
        logger.info("Starting system monitoring...")
        
        # Tạo các tasks giám sát
        self.monitoring_tasks = {
            'user_activity': asyncio.create_task(self._monitor_user_activity()),
            'content_violations': asyncio.create_task(self._monitor_content_violations()),
            'system_performance': asyncio.create_task(self._monitor_system_performance()),
            'security_threats': asyncio.create_task(self._monitor_security_threats()),
            'database_health': asyncio.create_task(self._monitor_database_health()),
        }

    async def stop_monitoring(self):
        """Dừng giám sát hệ thống"""
        logger.info("Stopping system monitoring...")
        
        for task_name, task in self.monitoring_tasks.items():
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                logger.info(f"Monitoring task {task_name} cancelled")

    async def _monitor_user_activity(self):
        """Giám sát hoạt động người dùng"""
        while True:
            try:
                await self._check_user_registration_spike()
                await self._check_suspicious_login_patterns()
                await self._check_inactive_users()
                
                # Chạy mỗi 30 phút
                await asyncio.sleep(1800)
                
            except Exception as e:
                logger.error(f"Error in user activity monitoring: {e}")
                await asyncio.sleep(60)  # Retry sau 1 phút nếu có lỗi

    async def _check_user_registration_spike(self):
        """Kiểm tra đột biến đăng ký user"""
        try:
            one_hour_ago = datetime.now() - timedelta(hours=1)
            
            # Mock implementation - trong thực tế sẽ query database
            new_users_count = 5  # Giả lập
            
            if new_users_count > self.alert_thresholds['user_registration_spike']:
                await self._create_alert(
                    alert_type="user_activity",
                    severity="high",
                    title="Đột biến đăng ký người dùng",
                    message=f"Có {new_users_count} người dùng mới đăng ký trong 1 giờ qua, vượt ngưỡng {self.alert_thresholds['user_registration_spike']}",
                    metadata={
                        "new_users_count": new_users_count,
                        "threshold": self.alert_thresholds['user_registration_spike'],
                        "time_period": "1_hour"
                    }
                )
                
        except Exception as e:
            logger.error(f"Error checking user registration spike: {e}")

    async def _check_suspicious_login_patterns(self):
        """Kiểm tra pattern đăng nhập đáng ngờ"""
        try:
            # Kiểm tra đăng nhập từ nhiều địa điểm khác nhau
            # Kiểm tra đăng nhập trên quá nhiều thiết bị
            # Kiểm tra thời gian đăng nhập bất thường
            
            # Mock implementation
            suspicious_users = [
                {
                    "user_id": "mock_user_1",
                    "email": "user1@example.com",
                    "issue": "Đăng nhập từ 5 quốc gia khác nhau trong 2 giờ",
                    "devices": 7
                }
            ]
            
            for user in suspicious_users:
                if user["devices"] > self.alert_thresholds['multiple_device_login']:
                    await self._create_alert(
                        alert_type="security",
                        severity="medium",
                        title="Hoạt động đăng nhập đáng ngờ",
                        message=f"User {user['email']}: {user['issue']}",
                        metadata={
                            "user_id": user["user_id"],
                            "user_email": user["email"],
                            "device_count": user["devices"],
                            "issue": user["issue"]
                        }
                    )
                    
        except Exception as e:
            logger.error(f"Error checking suspicious login patterns: {e}")

    async def _check_inactive_users(self):
        """Kiểm tra users không hoạt động lâu"""
        try:
            thirty_days_ago = datetime.now() - timedelta(days=30)
            
            # Mock implementation
            inactive_premium_users = [
                {
                    "user_id": "mock_user_2",
                    "email": "premium_user@example.com",
                    "subscription_plan": "premium",
                    "last_login": thirty_days_ago - timedelta(days=5)
                }
            ]
            
            if len(inactive_premium_users) > 0:
                await self._create_alert(
                    alert_type="user_activity",
                    severity="low",
                    title="Users premium không hoạt động",
                    message=f"Có {len(inactive_premium_users)} users premium không đăng nhập >30 ngày",
                    metadata={
                        "inactive_count": len(inactive_premium_users),
                        "users": inactive_premium_users
                    }
                )
                
        except Exception as e:
            logger.error(f"Error checking inactive users: {e}")

    async def _monitor_content_violations(self):
        """Giám sát vi phạm nội dung"""
        while True:
            try:
                await self._check_violation_reports_spike()
                await self._check_pending_moderations()
                
                # Chạy mỗi 15 phút
                await asyncio.sleep(900)
                
            except Exception as e:
                logger.error(f"Error in content violation monitoring: {e}")
                await asyncio.sleep(60)

    async def _check_violation_reports_spike(self):
        """Kiểm tra đột biến báo cáo vi phạm"""
        try:
            one_hour_ago = datetime.now() - timedelta(hours=1)
            
            # Mock implementation
            recent_reports_count = 25
            
            if recent_reports_count > self.alert_thresholds['content_violation_spike']:
                await self._create_alert(
                    alert_type="content",
                    severity="high",
                    title="Đột biến báo cáo vi phạm",
                    message=f"Có {recent_reports_count} báo cáo vi phạm trong 1 giờ qua",
                    metadata={
                        "reports_count": recent_reports_count,
                        "threshold": self.alert_thresholds['content_violation_spike'],
                        "time_period": "1_hour"
                    }
                )
                
        except Exception as e:
            logger.error(f"Error checking violation reports spike: {e}")

    async def _check_pending_moderations(self):
        """Kiểm tra nội dung chờ kiểm duyệt"""
        try:
            pending_moderations = await admin_crud.get_pending_moderations()
            
            if len(pending_moderations) > 50:  # Ngưỡng cảnh báo
                await self._create_alert(
                    alert_type="content",
                    severity="medium",
                    title="Quá nhiều nội dung chờ kiểm duyệt",
                    message=f"Có {len(pending_moderations)} nội dung chờ kiểm duyệt",
                    metadata={
                        "pending_count": len(pending_moderations),
                        "threshold": 50
                    }
                )
                
        except Exception as e:
            logger.error(f"Error checking pending moderations: {e}")

    async def _monitor_system_performance(self):
        """Giám sát hiệu suất hệ thống"""
        while True:
            try:
                await self._check_response_time()
                await self._check_error_rates()
                await self._check_resource_usage()
                
                # Chạy mỗi 5 phút
                await asyncio.sleep(300)
                
            except Exception as e:
                logger.error(f"Error in system performance monitoring: {e}")
                await asyncio.sleep(60)

    async def _check_response_time(self):
        """Kiểm tra thời gian phản hồi"""
        try:
            # Mock implementation - trong thực tế sẽ đo actual response time
            avg_response_time = 250  # milliseconds
            
            if avg_response_time > 500:  # Ngưỡng cảnh báo
                await self._create_alert(
                    alert_type="performance",
                    severity="medium",
                    title="Thời gian phản hồi chậm",
                    message=f"Thời gian phản hồi trung bình: {avg_response_time}ms",
                    metadata={
                        "avg_response_time": avg_response_time,
                        "threshold": 500
                    }
                )
                
        except Exception as e:
            logger.error(f"Error checking response time: {e}")

    async def _check_error_rates(self):
        """Kiểm tra tỷ lệ lỗi"""
        try:
            # Mock implementation
            error_count_5min = 2
            
            if error_count_5min > self.alert_thresholds['high_error_rate']:
                await self._create_alert(
                    alert_type="performance",
                    severity="high",
                    title="Tỷ lệ lỗi cao",
                    message=f"Có {error_count_5min} lỗi trong 5 phút qua",
                    metadata={
                        "error_count": error_count_5min,
                        "threshold": self.alert_thresholds['high_error_rate'],
                        "time_period": "5_minutes"
                    }
                )
                
        except Exception as e:
            logger.error(f"Error checking error rates: {e}")

    async def _check_resource_usage(self):
        """Kiểm tra sử dụng tài nguyên"""
        try:
            # Mock implementation - trong thực tế sẽ đo CPU, Memory, Disk
            cpu_usage = 85  # percentage
            memory_usage = 90  # percentage
            
            if cpu_usage > 80:
                await self._create_alert(
                    alert_type="performance",
                    severity="medium",
                    title="CPU sử dụng cao",
                    message=f"CPU đang sử dụng {cpu_usage}%",
                    metadata={"cpu_usage": cpu_usage, "threshold": 80}
                )
            
            if memory_usage > 85:
                await self._create_alert(
                    alert_type="performance",
                    severity="high",
                    title="Memory sử dụng cao",
                    message=f"Memory đang sử dụng {memory_usage}%",
                    metadata={"memory_usage": memory_usage, "threshold": 85}
                )
                
        except Exception as e:
            logger.error(f"Error checking resource usage: {e}")

    async def _monitor_security_threats(self):
        """Giám sát các mối đe dọa bảo mật"""
        while True:
            try:
                await self._check_failed_login_attempts()
                await self._check_ddos_patterns()
                await self._check_data_breach_indicators()
                
                # Chạy mỗi 10 phút
                await asyncio.sleep(600)
                
            except Exception as e:
                logger.error(f"Error in security threat monitoring: {e}")
                await asyncio.sleep(60)

    async def _check_failed_login_attempts(self):
        """Kiểm tra các lần đăng nhập thất bại"""
        try:
            # Mock implementation
            failed_attempts_by_ip = {
                "192.168.1.100": 15,
                "10.0.0.50": 12
            }
            
            for ip, attempts in failed_attempts_by_ip.items():
                if attempts > 10:  # Ngưỡng cảnh báo
                    await self._create_alert(
                        alert_type="security",
                        severity="high",
                        title="Tấn công brute force",
                        message=f"IP {ip} có {attempts} lần đăng nhập thất bại",
                        metadata={
                            "ip_address": ip,
                            "failed_attempts": attempts,
                            "threshold": 10
                        }
                    )
                    
        except Exception as e:
            logger.error(f"Error checking failed login attempts: {e}")

    async def _check_ddos_patterns(self):
        """Kiểm tra patterns tấn công DDoS"""
        try:
            # Mock implementation
            requests_per_minute_by_ip = {
                "203.0.113.1": 500,
                "198.51.100.1": 350
            }
            
            for ip, rpm in requests_per_minute_by_ip.items():
                if rpm > 300:  # Ngưỡng cảnh báo
                    await self._create_alert(
                        alert_type="security",
                        severity="critical",
                        title="Nghi ngờ tấn công DDoS",
                        message=f"IP {ip} gửi {rpm} requests/phút",
                        metadata={
                            "ip_address": ip,
                            "requests_per_minute": rpm,
                            "threshold": 300
                        }
                    )
                    
        except Exception as e:
            logger.error(f"Error checking DDoS patterns: {e}")

    async def _check_data_breach_indicators(self):
        """Kiểm tra dấu hiệu rò rỉ dữ liệu"""
        try:
            # Mock implementation - kiểm tra:
            # - Truy cập bất thường vào database
            # - Download large datasets
            # - Truy cập user data ngoài giờ
            
            suspicious_data_access = [
                {
                    "admin_id": "mock_admin_1",
                    "admin_email": "admin@example.com",
                    "action": "bulk_user_export",
                    "records_count": 10000,
                    "time": datetime.now() - timedelta(minutes=30)
                }
            ]
            
            for access in suspicious_data_access:
                if access["records_count"] > 5000:
                    await self._create_alert(
                        alert_type="security",
                        severity="critical",
                        title="Truy cập dữ liệu đáng ngờ",
                        message=f"Admin {access['admin_email']} export {access['records_count']} records",
                        metadata=access
                    )
                    
        except Exception as e:
            logger.error(f"Error checking data breach indicators: {e}")

    async def _monitor_database_health(self):
        """Giám sát tình trạng database"""
        while True:
            try:
                await self._check_database_connections()
                await self._check_database_performance()
                await self._check_storage_space()
                
                # Chạy mỗi 10 phút
                await asyncio.sleep(600)
                
            except Exception as e:
                logger.error(f"Error in database health monitoring: {e}")
                await asyncio.sleep(60)

    async def _check_database_connections(self):
        """Kiểm tra kết nối database"""
        try:
            # Mock implementation
            active_connections = 45
            max_connections = 100
            
            if active_connections > max_connections * 0.8:
                await self._create_alert(
                    alert_type="database",
                    severity="medium",
                    title="Kết nối database cao",
                    message=f"Đang có {active_connections}/{max_connections} kết nối database",
                    metadata={
                        "active_connections": active_connections,
                        "max_connections": max_connections,
                        "usage_percentage": (active_connections / max_connections) * 100
                    }
                )
                
        except Exception as e:
            logger.error(f"Error checking database connections: {e}")

    async def _check_database_performance(self):
        """Kiểm tra hiệu suất database"""
        try:
            # Mock implementation
            slow_queries_count = 3
            avg_query_time = 150  # milliseconds
            
            if slow_queries_count > 5:
                await self._create_alert(
                    alert_type="database",
                    severity="medium",
                    title="Queries chậm",
                    message=f"Có {slow_queries_count} queries chậm, thời gian TB: {avg_query_time}ms",
                    metadata={
                        "slow_queries": slow_queries_count,
                        "avg_query_time": avg_query_time
                    }
                )
                
        except Exception as e:
            logger.error(f"Error checking database performance: {e}")

    async def _check_storage_space(self):
        """Kiểm tra dung lượng lưu trữ"""
        try:
            # Mock implementation
            storage_usage_percentage = 88
            
            if storage_usage_percentage > 85:
                severity = "critical" if storage_usage_percentage > 95 else "high"
                await self._create_alert(
                    alert_type="storage",
                    severity=severity,
                    title="Dung lượng lưu trữ gần đầy",
                    message=f"Đã sử dụng {storage_usage_percentage}% dung lượng",
                    metadata={
                        "storage_usage": storage_usage_percentage,
                        "threshold": 85
                    }
                )
                
        except Exception as e:
            logger.error(f"Error checking storage space: {e}")

    async def _create_alert(self, alert_type: str, severity: str, title: str, 
                          message: str, metadata: Dict[str, Any] = None):
        """Tạo cảnh báo hệ thống"""
        try:
            alert_id = await admin_service.create_system_alert(
                alert_type=alert_type,
                severity=severity,
                title=title,
                message=message,
                metadata=metadata or {}
            )
            
            logger.info(f"Created system alert: {title} (ID: {alert_id})")
            
            # Nếu là cảnh báo critical, có thể gửi email/SMS ngay lập tức
            if severity == "critical":
                await self._send_immediate_notification(title, message, metadata)
                
        except Exception as e:
            logger.error(f"Error creating alert: {e}")

    async def _send_immediate_notification(self, title: str, message: str, 
                                         metadata: Dict[str, Any] = None):
        """Gửi thông báo khẩn cấp ngay lập tức"""
        try:
            # Trong thực tế sẽ gửi email, SMS, hoặc push notification
            # đến các admin được cấu hình
            logger.critical(f"IMMEDIATE ALERT: {title} - {message}")
            
            # Mock implementation - gửi email
            admin_emails = ["admin1@movigo.com", "admin2@movigo.com"]
            for email in admin_emails:
                await self._send_email_alert(email, title, message, metadata)
                
        except Exception as e:
            logger.error(f"Error sending immediate notification: {e}")

    async def _send_email_alert(self, email: str, title: str, message: str,
                              metadata: Dict[str, Any] = None):
        """Gửi email cảnh báo"""
        try:
            # Mock implementation - trong thực tế sẽ dùng SMTP hoặc email service
            logger.info(f"Sending email alert to {email}: {title}")
            
            # Email content
            email_content = f"""
            MOVIGO SYSTEM ALERT
            
            Title: {title}
            Message: {message}
            Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
            
            Metadata: {metadata if metadata else 'None'}
            
            Please check the admin dashboard for more details.
            """
            
            # Trong thực tế sẽ gửi email qua SMTP
            print(f"EMAIL TO {email}:\n{email_content}")
            
        except Exception as e:
            logger.error(f"Error sending email alert: {e}")

# Global instance
notification_service = NotificationService() 