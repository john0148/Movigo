/**
 * Application Constants
 * 
 * Định nghĩa các hằng số và cấu hình chung cho ứng dụng.
 * Giúp quản lý tập trung các giá trị cố định được sử dụng trong ứng dụng.
 */

// API URLs
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
export const baseImageUrl = 'https://i.ibb.co/';
export const BASE_IMAGE_URL = 'https://i.ibb.co/';

// Firebase Configuration
export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGE_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validate Firebase config
const validateFirebaseConfig = () => {
  const requiredKeys = ['apiKey', 'authDomain', 'projectId'];
  const missingKeys = requiredKeys.filter(key => !FIREBASE_CONFIG[key]);
  
  if (missingKeys.length > 0) {
    console.error('❌ Missing Firebase environment variables:', missingKeys);
    console.error('Please check your .env file and restart the dev server');
    return false;
  }
  
  console.log('✅ Firebase config validated successfully');
  return true;
};

export const IS_FIREBASE_CONFIGURED = validateFirebaseConfig();

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

export const genresMovie = [
  { value: "Phim Hài", label: "Hài Hước" },
  { value: "Phim Hành Động", label: "Hành Động" },
  { value: "Phim Hình Sự", label: "Hình Sự" },
  { value: "Phim Chính Kịch", label: "Chính Kịch" },
  { value: "Phim Cổ Trang", label: "Cổ Trang" },
  { value: "Phim Võ Thuật", label: "Võ Thuật" },
  { value: "Phim Tâm Lý", label: "Tâm Lý" },
  { value: "Phim Tình Cảm", label: "Tình Cảm" },
  { value: "Phim Hoạt Hình", label: "Hoạt Hình" }
];

export const yearOptions = [
    { value: "", label: "Năm" },
    { value: "2025", label: "2025" },
    { value: "2024", label: "2024" },
    { value: "2023", label: "2023" },
    { value: "2022", label: "2022" },
    // { value: "2021", label: "2021" },
    // { value: "2020", label: "2020" },
    // { value: "2019", label: "2019" },
    // { value: "2018", label: "2018" },
    // { value: "2017", label: "2017" },
    // { value: "2010s", label: "2010-2019" },
    // { value: "2000s", label: "2000-2009" },
    // { value: "1990s", label: "1990-1999" },
    // { value: "classic", label: "Trước 1990" }
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