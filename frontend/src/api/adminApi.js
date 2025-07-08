import axios from 'axios';
import { handleApiError } from '../utils/errorHandler';
import { API_BASE_URL } from '../config/constants';

const API_URL = `${API_BASE_URL}/admin`;

/**
 * Admin API Service
 * Xử lý các API calls cho admin functionality
 */

// Thiết lập axios interceptor để tự động thêm token vào header
const authAxios = axios.create({
    baseURL: API_URL
});

authAxios.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => Promise.reject(error)
);

// Dashboard APIs
export const getDashboardStats = async () => {
    try {
        const response = await authAxios.get('/dashboard');
        return response.data;
    } catch (error) {
        return handleApiError(error, 'Không thể lấy thống kê dashboard');
    }
};

export const getAnalytics = async (params = {}) => {
    try {
        const response = await authAxios.get('/analytics', { params });
        return response.data;
    } catch (error) {
        return handleApiError(error, 'Không thể lấy dữ liệu phân tích');
    }
};

// User Management APIs
export const getUsers = async (searchParams = {}) => {
    try {
        const response = await authAxios.get('/users', { params: searchParams });
        return response.data;
    } catch (error) {
        return handleApiError(error, 'Không thể lấy danh sách người dùng');
    }
};

export const updateUser = async (userId, updateData) => {
    try {
        const response = await authAxios.put(`/users/${userId}`, updateData);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'Không thể cập nhật người dùng');
    }
};

export const banUser = async (userId, reason) => {
    try {
        const response = await authAxios.post(`/users/${userId}/ban`, null, {
            params: { reason }
        });
        return response.data;
    } catch (error) {
        return handleApiError(error, 'Không thể cấm người dùng');
    }
};

export const unbanUser = async (userId) => {
    try {
        const response = await authAxios.post(`/users/${userId}/unban`);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'Không thể bỏ cấm người dùng');
    }
};

export const bulkUserAction = async (actionData) => {
    try {
        const response = await authAxios.post('/users/bulk-action', actionData);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'Không thể thực hiện hành động hàng loạt');
    }
};

// Content Moderation APIs
export const getModerationQueue = async (params = {}) => {
    try {
        const response = await authAxios.get('/moderation/queue', { params });
        return response.data;
    } catch (error) {
        return handleApiError(error, 'Không thể lấy hàng đợi kiểm duyệt');
    }
};

export const moderateContent = async (moderationId, moderationData) => {
    try {
        const response = await authAxios.put(`/moderation/${moderationId}`, moderationData);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'Không thể kiểm duyệt nội dung');
    }
};

export const bulkContentAction = async (actionData) => {
    try {
        const response = await authAxios.post('/moderation/bulk-action', actionData);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'Không thể thực hiện hành động hàng loạt cho nội dung');
    }
};

// Violation Reports APIs
export const getViolationReports = async (params = {}) => {
    try {
        const response = await authAxios.get('/violations', { params });
        return response.data;
    } catch (error) {
        return handleApiError(error, 'Không thể lấy báo cáo vi phạm');
    }
};

export const assignViolationReport = async (reportId) => {
    try {
        const response = await authAxios.post(`/violations/${reportId}/assign`);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'Không thể phân công báo cáo vi phạm');
    }
};

export const resolveViolationReport = async (reportId, actionData) => {
    try {
        const response = await authAxios.put(`/violations/${reportId}/resolve`, actionData);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'Không thể giải quyết báo cáo vi phạm');
    }
};

// System Alerts APIs
export const getSystemAlerts = async (params = {}) => {
    try {
        const response = await authAxios.get('/alerts', { params });
        return response.data;
    } catch (error) {
        return handleApiError(error, 'Không thể lấy cảnh báo hệ thống');
    }
};

export const createSystemAlert = async (alertData) => {
    try {
        const response = await authAxios.post('/alerts', alertData);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'Không thể tạo cảnh báo hệ thống');
    }
};

export const acknowledgeAlert = async (alertId) => {
    try {
        const response = await authAxios.put(`/alerts/${alertId}/acknowledge`);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'Không thể xác nhận cảnh báo');
    }
};

// Admin Logs APIs
export const getAdminLogs = async (params = {}) => {
    try {
        const response = await authAxios.get('/logs', { params });
        return response.data;
    } catch (error) {
        return handleApiError(error, 'Không thể lấy logs hoạt động admin');
    }
};

// Security APIs
export const getSuspiciousActivities = async () => {
    try {
        const response = await authAxios.get('/security/suspicious-activities');
        return response.data;
    } catch (error) {
        return handleApiError(error, 'Không thể lấy hoạt động đáng ngờ');
    }
};

// Content Search APIs
export const searchContent = async (searchParams = {}) => {
    try {
        const response = await authAxios.get('/content/search', { params: searchParams });
        return response.data;
    } catch (error) {
        return handleApiError(error, 'Không thể tìm kiếm nội dung');
    }
};

// Export all admin API functions
export const adminApi = {
    // Dashboard
    getDashboardStats,
    getAnalytics,

    // User Management
    getUsers,
    updateUser,
    banUser,
    unbanUser,
    bulkUserAction,

    // Content Moderation
    getModerationQueue,
    moderateContent,
    bulkContentAction,

    // Violation Reports
    getViolationReports,
    assignViolationReport,
    resolveViolationReport,

    // System Alerts
    getSystemAlerts,
    createSystemAlert,
    acknowledgeAlert,

    // Admin Logs
    getAdminLogs,

    // Security
    getSuspiciousActivities,

    // Content Search
    searchContent
}; 