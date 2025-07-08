import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute Component
 * TEMPORARILY DISABLED FOR DEVELOPMENT
 * All routes are now accessible without authentication
 */
const ProtectedRoute = ({ children, requiredRole }) => {
  // Temporarily bypass authentication
  // return children;

  /*
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
  */


  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute; 