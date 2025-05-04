/**
 * Authentication API
 * 
 * Cung cấp các hàm giao tiếp với backend API cho các chức năng xác thực:
 * - Đăng ký tài khoản
 * - Đăng nhập
 * - Đăng nhập bằng Google
 * - Đăng xuất
 * - Lấy thông tin người dùng hiện tại
 * - Refresh token
 * 
 * TEMPORARILY MODIFIED FOR DEVELOPMENT: Authentication is bypassed
 */

import axios from 'axios';
import { handleApiError } from '../utils/errorHandler';
import { API_BASE_URL, AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, TOKEN_EXPIRY_KEY, USER_DATA_KEY } from '../config/constants';

const API_URL = `${API_BASE_URL}/auth`;

// Cấu hình axios interceptors để tự động thêm token và xử lý token expired
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Temporarily skip token refresh for development
    return Promise.reject(error);

    /*
    const originalRequest = error.config;
    
    // Nếu lỗi 401 (Unauthorized) và chưa thử refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Thực hiện refresh token
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (refreshToken) {
          const response = await refreshAccessToken(refreshToken);
          
          // Lưu token mới
          setAuthData(response.data);
          
          // Cập nhật Authorization header và thực hiện lại request ban đầu
          originalRequest.headers['Authorization'] = `Bearer ${response.data.access_token}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        // Nếu refresh token thất bại, đăng xuất người dùng
        logout();
      }
    }
    
    return Promise.reject(error);
    */
  }
);

/**
 * Lưu thông tin xác thực vào localStorage
 * @param {Object} authData Dữ liệu xác thực (access_token, refresh_token, expires_in, user)
 */
const setAuthData = (authData) => {
  const { access_token, refresh_token, expires_in, user } = authData;

  // Tính thời gian token hết hạn
  const expiryTime = new Date().getTime() + expires_in * 1000;

  localStorage.setItem(AUTH_TOKEN_KEY, access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());

  if (user) {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
  }
};

/**
 * Xóa thông tin xác thực khỏi localStorage
 */
const clearAuthData = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  localStorage.removeItem(USER_DATA_KEY);
};

/**
 * Đăng ký tài khoản mới
 * @param {Object} userData Dữ liệu người dùng (email, password, phone, subscription_type)
 * @returns {Promise<Object>} Phản hồi từ server
 */
export const register = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/register`, userData);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Đăng ký thất bại');
  }
};

/**
 * Đăng nhập với email và mật khẩu
 * @param {Object} credentials Thông tin đăng nhập (email, password, remember_me)
 * @returns {Promise<Object>} Dữ liệu xác thực (access_token, refresh_token, user)
 */
export const login = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/login`, credentials);
    setAuthData(response.data);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Đăng nhập thất bại');
  }
};

/**
 * Đăng nhập bằng Google
 * @returns {Promise<Object>} Dữ liệu xác thực (access_token, refresh_token, user)
 */
export const loginWithGoogle = async () => {
  try {
    // Trong môi trường thực tế, cần khởi tạo Google OAuth
    // Đây là phiên bản đơn giản hóa
    const googleAuth = await initializeGoogleAuth();
    const googleToken = await googleAuth.getToken();

    // Gửi token đến server để xác thực
    const response = await axios.post(`${API_URL}/google`, { token: googleToken });

    setAuthData(response.data);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Đăng nhập với Google thất bại');
  }
};

/**
 * Khởi tạo Google OAuth
 * Đây là placeholder cho việc tích hợp Google OAuth thực tế
 * @returns {Promise<Object>} Đối tượng xác thực Google
 */
const initializeGoogleAuth = async () => {
  // Trong ứng dụng thực tế, sẽ sử dụng Google OAuth library
  // Đây chỉ là placeholder
  console.log('Initializing Google Auth...');

  return {
    getToken: async () => {
      // Mô phỏng việc lấy token từ Google
      return 'google_token_placeholder';
    }
  };
};

/**
 * Refresh access token
 * @param {string} refreshToken Refresh token hiện tại
 * @returns {Promise<Object>} Phản hồi chứa token mới
 */
export const refreshAccessToken = async (refreshToken) => {
  try {
    const response = await axios.post(`${API_URL}/refresh`, { refresh_token: refreshToken });
    return response;
  } catch (error) {
    return handleApiError(error, 'Không thể làm mới token');
  }
};

/**
 * Đăng xuất
 * @returns {Promise<void>}
 */
export const logout = async () => {
  try {
    // Gọi API đăng xuất nếu cần
    await axios.post(`${API_URL}/logout`);
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Xóa dữ liệu xác thực dù API thành công hay thất bại
    clearAuthData();

    // Nếu cần, chuyển hướng người dùng đến trang đăng nhập
    // window.location.href = '/login';
  }
};

/**
 * Lấy thông tin người dùng hiện tại
 * @returns {Promise<Object>} Thông tin người dùng
 */
export const getCurrentUser = async () => {
  // DEVELOPMENT MODE: Return mock user data or throw error to simulate not logged in
  console.log('getCurrentUser called - DEVELOPMENT MODE: No authentication required');
  // Throwing error to simulate not logged in (handled in App.jsx)
  return Promise.reject('Authentication disabled for development');

  /*
  try {
    // Trước tiên, kiểm tra dữ liệu người dùng trong localStorage
    const userData = localStorage.getItem(USER_DATA_KEY);
    if (userData) {
      return JSON.parse(userData);
    }
    
    // Nếu không có, gọi API để lấy thông tin người dùng
    const response = await axios.get(`${API_URL}/me`);
    
    // Lưu thông tin người dùng vào localStorage
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(response.data));
    
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Không thể lấy thông tin người dùng');
  }
  */
};

/**
 * Kiểm tra xem người dùng đã đăng nhập chưa
 * @returns {boolean} True nếu đã đăng nhập
 */
export const isAuthenticated = () => {
  // DEVELOPMENT MODE: Always return false to simulate not logged in
  return false;

  /*
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
  
  if (!token || !expiryTime) {
    return false;
  }
  
  // Kiểm tra token còn hạn không
  return new Date().getTime() < parseInt(expiryTime);
  */
}; 