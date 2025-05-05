import axios from 'axios';
import { handleApiError } from '../utils/errorHandler';
import { API_BASE_URL, USER_DATA_KEY } from '../config/constants';

const API_URL = `${API_BASE_URL}/profiles`;
const WATCH_STATS_URL = `${API_BASE_URL}/watch-stats`;

/**
 * Service xử lý các API liên quan đến thông tin user
 * - Lấy thông tin profile
 * - Cập nhật thông tin profile
 * - Upload avatar
 * - Lấy thống kê xem phim
 */

// Thiết lập axios interceptor để tự động thêm token vào header
const authAxios = axios.create({
  baseURL: API_URL
});

authAxios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

/**
 * Get user profile information
 * @returns {Promise<Object>} User profile data
 */
export const getUserProfile = async () => {
  try {
    // Try real API endpoint first
    try {
      const response = await axios.get(`${API_URL}/me`);
      return response.data;
    } catch (apiError) {
      console.log('Failed to fetch real profile, using mock data', apiError);

      // If API fails, get user from localStorage or return mock data
      const userData = localStorage.getItem(USER_DATA_KEY);
      if (userData) {
        const user = JSON.parse(userData);
        return {
          ...user,
          phone: '0912345678',
          birth_date: '1990-01-01',
          gender: 'male'
        };
      }

      // Create mock user data
      return {
        _id: 'mock-id',
        email: 'user@example.com',
        full_name: 'Demo User',
        role: 'user',
        subscription_plan: 'premium',
        avatar_url: '/avatars/default-avatar.png',
        phone: '0912345678',
        birth_date: '1990-01-01',
        gender: 'male',
        max_devices: 4
      };
    }
  } catch (error) {
    return handleApiError(error, 'Không thể lấy thông tin hồ sơ');
  }
};

/**
 * Update user profile
 * @param {Object} profileData Profile data to update
 * @returns {Promise<Object>} Updated profile
 */
export const updateUserProfile = async (profileData) => {
  try {
    const response = await axios.put(`${API_URL}/me`, profileData);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Không thể cập nhật hồ sơ');
  }
};

/**
 * Upload user avatar
 * @param {FormData} formData Form data containing avatar image
 * @returns {Promise<Object>} Response with new avatar URL
 */
export const uploadAvatar = async (formData) => {
  try {
    const response = await axios.post(`${API_URL}/me/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Không thể tải lên ảnh đại diện');
  }
};

/**
 * Get user watching statistics
 * @param {string} period Period for statistics (week, month, year)
 * @returns {Promise<Object>} Statistics data
 */
export const getWatchingStats = async (period = 'week') => {
  try {
    // Try real API endpoint first
    try {
      const response = await axios.get(`${WATCH_STATS_URL}?period=${period}`);
      return response.data;
    } catch (apiError) {
      console.log(`Failed to fetch real watch stats for period ${period}, using mock data`, apiError);

      // If API fails, return mock data based on period
      return generateMockWatchStats(period);
    }
  } catch (error) {
    return handleApiError(error, 'Không thể lấy thống kê xem phim');
  }
};

/**
 * Generate mock watch statistics data
 * @param {string} period Time period (week, month, year)
 * @returns {Object} Mock statistics data
 */
const generateMockWatchStats = (period) => {
  let data = {};

  switch (period) {
    case 'week':
      data = {
        labels: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'],
        watchMinutes: [30, 45, 60, 20, 75, 120, 90],
        daily_minutes: [30, 45, 60, 20, 75, 120, 90],
        totalMovies: 8,
        totalMinutes: 440,
        favoriteGenre: 'Hành động'
      };
      break;
    case 'month':
      data = {
        labels: ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'],
        watchMinutes: [180, 240, 300, 210],
        monthly_minutes: Array(31).fill(0).map(() => Math.floor(Math.random() * 100)),
        totalMovies: 15,
        totalMinutes: 930,
        favoriteGenre: 'Hài'
      };
      break;
    case 'year':
      data = {
        labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
        watchMinutes: [500, 450, 600, 700, 550, 400, 650, 800, 750, 600, 500, 550],
        yearly_minutes: [500, 450, 600, 700, 550, 400, 650, 800, 750, 600, 500, 550],
        totalMovies: 120,
        totalMinutes: 7050,
        favoriteGenre: 'Khoa học viễn tưởng'
      };
      break;
    default:
      data = {
        labels: [],
        watchMinutes: [],
        totalMovies: 0,
        totalMinutes: 0,
        favoriteGenre: 'N/A'
      };
  }

  return data;
};

// Lấy danh sách lịch sử xem phim
export const getWatchHistory = async (page = 1, limit = 10) => {
  try {
    const response = await authAxios.get(`${API_URL}/watch-history`, {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching watch history:', error);
    throw error;
  }
};

// Lấy danh sách xem sau
export const getWatchLater = async (page = 1, limit = 10) => {
  try {
    const response = await authAxios.get(`${API_URL}/watch-later`, {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching watch later list:', error);
    throw error;
  }
};

// Thêm phim vào danh sách xem sau
export const addToWatchLater = async (movieId) => {
  try {
    const response = await authAxios.post(`${API_URL}/watch-later`, {
      movie_id: movieId
    });
    return response.data;
  } catch (error) {
    console.error('Error adding movie to watch later:', error);
    throw error;
  }
};

// Xóa phim khỏi danh sách xem sau
export const removeFromWatchLater = async (movieId) => {
  try {
    const response = await authAxios.delete(`${API_URL}/watch-later/${movieId}`);
    return response.data;
  } catch (error) {
    console.error('Error removing movie from watch later:', error);
    throw error;
  }
};