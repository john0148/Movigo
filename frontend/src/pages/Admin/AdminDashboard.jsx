import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../api/adminApi';
import '../../styles/AdminDashboard.css';

/**
 * Admin Dashboard Component
 * Trang chính của admin panel hiển thị thống kê tổng quan
 */
const AdminDashboard = () => {
    const { user, isLoggedIn } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Kiểm tra quyền admin
        if (!isLoggedIn || user?.role !== 'admin') {
            navigate('/login');
            return;
        }

        loadDashboardData();
    }, [isLoggedIn, user, navigate]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            // Tải thống kê dashboard
            const statsData = await adminApi.getDashboardStats();
            setStats(statsData);

            // Tải cảnh báo chưa xử lý
            const alertsData = await adminApi.getSystemAlerts({ acknowledged: false });
            setAlerts(alertsData.slice(0, 5)); // Chỉ hiển thị 5 cảnh báo mới nhất

            // Tải hoạt động gần đây
            const activitiesData = await adminApi.getAdminLogs({ limit: 10 });
            setRecentActivities(activitiesData.items || []);

        } catch (err) {
            console.error('Error loading dashboard:', err);
            setError('Không thể tải dữ liệu dashboard');
        } finally {
            setLoading(false);
        }
    };

    const acknowledgeAlert = async (alertId) => {
        try {
            await adminApi.acknowledgeAlert(alertId);
            setAlerts(alerts.filter(alert => alert.id !== alertId));
        } catch (err) {
            console.error('Error acknowledging alert:', err);
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return '#ff4757';
            case 'high': return '#ff7675';
            case 'medium': return '#fdcb6e';
            case 'low': return '#74b9ff';
            default: return '#ddd';
        }
    };

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num?.toString() || '0';
    };

    if (loading) {
        return (
            <div className="admin-dashboard loading">
                <div className="spinner"></div>
                <p>Đang tải dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-dashboard error">
                <h2>Lỗi</h2>
                <p>{error}</p>
                <button onClick={loadDashboardData}>Thử lại</button>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <div className="dashboard-container">
                <div className="dashboard-header">
                    <h1>Admin Dashboard</h1>
                    <p>Chào mừng, {user?.full_name || user?.email}</p>
                </div>

                {/* Stats Cards */}
                <div className="stats-grid">
                    <div className="stat-card users">
                        <div className="stat-icon">👥</div>
                        <div className="stat-content">
                            <h3>{formatNumber(stats?.total_users)}</h3>
                            <p>Tổng người dùng</p>
                            <small>+{stats?.new_users_today} hôm nay</small>
                        </div>
                    </div>

                    <div className="stat-card movies">
                        <div className="stat-icon">🎬</div>
                        <div className="stat-content">
                            <h3>{formatNumber(stats?.total_movies)}</h3>
                            <p>Tổng phim</p>
                            <small>{formatNumber(stats?.total_views)} lượt xem</small>
                        </div>
                    </div>

                    <div className="stat-card reports">
                        <div className="stat-icon">⚠️</div>
                        <div className="stat-content">
                            <h3>{stats?.pending_reports}</h3>
                            <p>Báo cáo chờ xử lý</p>
                            <small>{stats?.system_alerts} cảnh báo</small>
                        </div>
                    </div>

                    <div className="stat-card revenue">
                        <div className="stat-icon">💰</div>
                        <div className="stat-content">
                            <h3>${formatNumber(stats?.revenue_today)}</h3>
                            <p>Doanh thu hôm nay</p>
                            <small>{stats?.active_users} users hoạt động</small>
                        </div>
                    </div>
                </div>

                <div className="dashboard-content">
                    {/* System Alerts */}
                    <div className="dashboard-section alerts-section">
                        <div className="section-header">
                            <h2>Cảnh báo hệ thống</h2>
                            <button
                                className="view-all-btn"
                                onClick={() => navigate('/admin/alerts')}
                            >
                                Xem tất cả
                            </button>
                        </div>

                        {alerts.length > 0 ? (
                            <div className="alerts-list">
                                {alerts.map(alert => (
                                    <div
                                        key={alert.id}
                                        className={`alert-item severity-${alert.severity}`}
                                    >
                                        <div className="alert-content">
                                            <div className="alert-header">
                                                <span
                                                    className="severity-badge"
                                                    style={{ backgroundColor: getSeverityColor(alert.severity) }}
                                                >
                                                    {alert.severity.toUpperCase()}
                                                </span>
                                                <span className="alert-time">
                                                    {new Date(alert.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                            <h4>{alert.title}</h4>
                                            <p>{alert.message}</p>
                                        </div>
                                        <button
                                            className="acknowledge-btn"
                                            onClick={() => acknowledgeAlert(alert.id)}
                                        >
                                            Xác nhận
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-alerts">
                                <p>Không có cảnh báo nào</p>
                            </div>
                        )}
                    </div>

                    {/* Recent Activities */}
                    <div className="dashboard-section activities-section">
                        <div className="section-header">
                            <h2>Hoạt động gần đây</h2>
                            <button
                                className="view-all-btn"
                                onClick={() => navigate('/admin/logs')}
                            >
                                Xem tất cả
                            </button>
                        </div>

                        {recentActivities.length > 0 ? (
                            <div className="activities-list">
                                {recentActivities.map((activity, index) => (
                                    <div key={index} className="activity-item">
                                        <div className="activity-time">
                                            {new Date(activity.timestamp).toLocaleString()}
                                        </div>
                                        <div className="activity-content">
                                            <span className="admin-email">{activity.admin_email}</span>
                                            <span className="action">{activity.action}</span>
                                            <span className="target">{activity.target_type}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-activities">
                                <p>Chưa có hoạt động nào</p>
                            </div>
                        )}
                    </div>

                    {/* Top Genres Chart */}
                    <div className="dashboard-section genres-section">
                        <h2>Thể loại phim phổ biến</h2>
                        <div className="genres-chart">
                            {stats?.top_genres?.map((genre, index) => (
                                <div key={index} className="genre-bar">
                                    <div className="genre-name">{genre.genre}</div>
                                    <div className="genre-count">{genre.count}</div>
                                    <div
                                        className="genre-progress"
                                        style={{
                                            width: `${(genre.count / stats.top_genres[0].count) * 100}%`
                                        }}
                                    ></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="quick-actions">
                    <h2>Thao tác nhanh</h2>
                    <div className="actions-grid">
                        <button
                            className="action-btn users-btn"
                            onClick={() => navigate('/admin/users')}
                        >
                            <span className="icon">👥</span>
                            Quản lý người dùng
                        </button>

                        <button
                            className="action-btn content-btn"
                            onClick={() => navigate('/admin/moderation')}
                        >
                            <span className="icon">🔍</span>
                            Kiểm duyệt nội dung
                        </button>

                        <button
                            className="action-btn reports-btn"
                            onClick={() => navigate('/admin/violations')}
                        >
                            <span className="icon">📋</span>
                            Báo cáo vi phạm
                        </button>

                        <button
                            className="action-btn analytics-btn"
                            onClick={() => navigate('/admin/analytics')}
                        >
                            <span className="icon">📊</span>
                            Phân tích dữ liệu
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard; 