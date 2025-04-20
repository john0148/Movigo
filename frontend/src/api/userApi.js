import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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

// Lấy thông tin profile của user
export const getUserProfile = async () => {
  try {
    const response = await authAxios.get(`${API_URL}/users/profile`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

// Cập nhật thông tin profile
export const updateUserProfile = async (profileData) => {
  try {
    const response = await authAxios.patch(`${API_URL}/users/profile`, profileData);
    return response.data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Upload avatar
export const uploadAvatar = async (formData) => {
  try {
    const response = await authAxios.post(`${API_URL}/users/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
};

// Lấy thống kê lịch sử xem phim
export const getWatchingStats = async (period = 'week') => {
  try {
    const response = await authAxios.get(`${API_URL}/users/watch-stats`, {
      params: { period }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching watch statistics:', error);
    throw error;
  }
};

// Lấy danh sách lịch sử xem phim
export const getWatchHistory = async (page = 1, limit = 10) => {
  try {
    const response = await authAxios.get(`${API_URL}/users/watch-history`, {
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
    const response = await authAxios.get(`${API_URL}/users/watch-later`, {
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
    const response = await authAxios.post(`${API_URL}/users/watch-later`, {
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
    const response = await authAxios.delete(`${API_URL}/users/watch-later/${movieId}`);
    return response.data;
  } catch (error) {
    console.error('Error removing movie from watch later:', error);
    throw error;
  }
};