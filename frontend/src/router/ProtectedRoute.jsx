import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../api/authApi';

/**
 * ProtectedRoute Component
 * Component bảo vệ các routes yêu cầu xác thực
 * - Kiểm tra xem người dùng đã đăng nhập chưa
 * - Nếu chưa đăng nhập, chuyển hướng đến trang login
 * - Nếu đã đăng nhập, hiển thị component con
 */
const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await getCurrentUser();
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-spinner"></div>
        <p>Đang kiểm tra đăng nhập...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page with current location to redirect back after login
    return <Navigate to="/login" state={{ from: location, message: 'Vui lòng đăng nhập để truy cập trang này' }} replace />;
  }

  return children;
};

export default ProtectedRoute; 