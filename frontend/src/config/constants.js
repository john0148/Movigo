/**
 * Application Constants
 * 
 * Định nghĩa các hằng số và cấu hình chung cho ứng dụng.
 * Giúp quản lý tập trung các giá trị cố định được sử dụng trong ứng dụng.
 */

// API URLs
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
export const baseImageUrl = 'https://image.tmdb.org/t/p/original';
export const BASE_IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

// Authentication
export const AUTH_TOKEN_KEY = 'auth_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';
export const TOKEN_EXPIRY_KEY = 'token_expiry';

// User
export const USER_DATA_KEY = 'user_data';

// Subscription types
export const SUBSCRIPTION_TYPES = {
  FREE: 'free',
  BASIC: 'basic',
  STANDARD: 'standard',
  PREMIUM: 'premium'
};

// Movie genres
export const MOVIE_GENRES = [
  { id: 'action', name: 'Hành động' },
  { id: 'adventure', name: 'Phiêu lưu' },
  { id: 'animation', name: 'Hoạt hình' },
  { id: 'comedy', name: 'Hài' },
  { id: 'crime', name: 'Tội phạm' },
  { id: 'documentary', name: 'Tài liệu' },
  { id: 'drama', name: 'Chính kịch' },
  { id: 'family', name: 'Gia đình' },
  { id: 'fantasy', name: 'Giả tưởng' },
  { id: 'history', name: 'Lịch sử' },
  { id: 'horror', name: 'Kinh dị' },
  { id: 'music', name: 'Âm nhạc' },
  { id: 'mystery', name: 'Bí ẩn' },
  { id: 'romance', name: 'Lãng mạn' },
  { id: 'science_fiction', name: 'Khoa học viễn tưởng' },
  { id: 'thriller', name: 'Ly kỳ' },
  { id: 'war', name: 'Chiến tranh' },
  { id: 'western', name: 'Cao bồi' }
];

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20;

// Media queries for responsive design
export const BREAKPOINTS = {
  xs: '480px',
  sm: '768px',
  md: '992px',
  lg: '1200px',
  xl: '1600px'
};

// Maximum file size for avatar upload (5MB)
export const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

// Allowed avatar file types
export const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

// Default avatar URL
export const DEFAULT_AVATAR_URL = '/assets/default-avatar.png';

// Rating scale
export const MAX_RATING = 10; 