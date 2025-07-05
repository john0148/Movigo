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
import { setManualLogout } from '../utils/autoLogin';

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
  (response) => {
    // Check if response contains user data with missing subscription_plan
    if (response.data && response.data.user && !response.data.user.subscription_plan) {
      console.warn('User data from API missing subscription_plan - this should be fixed on the backend');
      console.log('User data before fix:', response.data.user);
    }
    return response;
  },
  async (error) => {
    return Promise.reject(error);
  }
);

/**
 * Lưu thông tin xác thực vào localStorage
 * @param {Object} authData Dữ liệu xác thực (access_token, refresh_token, expires_in, user)
 */
const setAuthData = (authData) => {
  const { access_token, refresh_token, expires_in, user } = authData;

  // Tính thời gian token hết hạn
  const expiryTime = new Date().getTime() + (expires_in || 3600) * 1000;

  localStorage.setItem(AUTH_TOKEN_KEY, access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token || '');
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
    // Clear any existing user data to ensure clean state
    localStorage.removeItem(USER_DATA_KEY);
    // Clear the manual logout flag when user is deliberately logging in
    localStorage.removeItem('manual_logout');

    console.log(`Attempting to login with: ${credentials.email}`);

    // Create FormData to match FastAPI's OAuth2PasswordRequestForm
    const formData = new FormData();
    formData.append('username', credentials.email); // FastAPI expects 'username' even for email
    formData.append('password', credentials.password);

    // Set correct headers for form data
    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    // Convert FormData to URLSearchParams for proper submission
    const params = new URLSearchParams();
    params.append('username', credentials.email);
    params.append('password', credentials.password);

    // Gọi API backend với form data format
    const response = await axios.post(`${API_URL}/login`, params, config);
    console.log('Login successful with backend API:', response.data);

    // Lưu dữ liệu xác thực
    setAuthData(response.data);
    console.log('User data saved to localStorage, user:', response.data.user?.email);

    // For debugging
    const userAfterLogin = localStorage.getItem(USER_DATA_KEY);
    console.log('Verified user data in localStorage:', userAfterLogin ? 'present' : 'missing');

    return response.data;
  } catch (error) {
    // console.error('Login function error:', error);
    // if (error.response?.data?.detail) {
    //   throw new Error(error.response.data.detail);
    // }
    // throw error;
    console.error("🟥 Lỗi đăng nhập:", error);
    const message = error?.response?.data?.detail || "Đăng nhập thất bại";
    throw new Error(message);  // rất quan trọng
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
    console.log('Logging out user, clearing auth data');

    // Use the setManualLogout function to prevent auto-login
    setManualLogout();

    return true;
  } catch (error) {
    console.error('Error during logout:', error);
    console.log('Logout API call failed, clearing local auth data anyway');

    // Ensure we still set manual logout even if an error occurs
    setManualLogout();
  }
};

/**
 * Lấy thông tin người dùng hiện tại
 * @returns {Promise<Object>} Thông tin người dùng
 */
export const getCurrentUser = async () => {
  try {
    console.log('Attempting to get current user from backend API');
    const token = localStorage.getItem(AUTH_TOKEN_KEY);

    if (token) {
      const response = await axios.get(`${API_URL}/user/me`);
      console.log('Successfully retrieved user from backend:', response.data);

      // Lưu dữ liệu từ MongoDB vào localStorage
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(response.data));
      return response.data;
    }

    // Dùng dữ liệu từ localStorage nếu có token nhưng API thất bại
    console.log('No token found, checking localStorage');
    const storedUserData = localStorage.getItem(USER_DATA_KEY);

    if (storedUserData) {
      try {
        const userData = JSON.parse(storedUserData);
        console.log('Found user in localStorage:', userData.email);
        return userData;
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
      }
    }

    // Nếu không có user trong localStorage, trả về null
    console.log('No user found in localStorage');
    return null;
  } catch (error) {
    console.error('getCurrentUser error:', error);
    // Không throw error để tránh crash app, thay vào đó cố gắng lấy từ localStorage
    const storedUserData = localStorage.getItem(USER_DATA_KEY);
    if (storedUserData) {
      try {
        return JSON.parse(storedUserData);
      } catch (e) {
        console.error('Error parsing stored user data:', e);
      }
    }
    return null;
  }
};

/**
 * Kiểm tra xem người dùng đã đăng nhập chưa
 * @returns {boolean} True nếu đã đăng nhập
 */
export const isAuthenticated = () => {
  try {
    // First check if manual logout flag is set - if so, user is not authenticated
    const manualLogout = localStorage.getItem('manual_logout');
    if (manualLogout) {
      console.log('Manual logout flag is set - user is not authenticated');
      return false;
    }

    // Kiểm tra token và user data trong localStorage
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const userData = localStorage.getItem(USER_DATA_KEY);

    return !!(token && userData);
  } catch (error) {
    console.error('Error checking authentication status:', error);
    return false;
  }
};

/**
 * Kiểm tra trạng thái kết nối MongoDB
 * @returns {Promise<Object>} Kết quả kiểm tra kết nối
 */
export const checkMongoDBStatus = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/mongodb-status`);
    return response.data;
  } catch (error) {
    console.error('Error checking MongoDB status:', error);
    return {
      status: 'error',
      message: 'Không thể kiểm tra trạng thái MongoDB: ' +
        (error.response?.data?.message || error.message)
    };
  }
}; 