import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { getCurrentUser, logout } from './api/authApi';
import './App.css';

/**
 * App Component
 * Component gốc của ứng dụng, bao gồm:
 * - Navbar cho điều hướng
 * - Quản lý trạng thái đăng nhập toàn cục (temporarily disabled)
 * - Container cho các routes con
 */
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false); // Set to false to skip loading state
  const navigate = useNavigate();
  const location = useLocation();

  /* 
  // Authentication logic disabled
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.log('Not logged in');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [location.pathname]);
  */

  const handleLogout = () => {
    logout();
    setUser(null);
    navigate('/login');
  };

  // Function to navigate to profile page
  // No authentication check needed as ProtectedRoute is already modified to allow direct access
  const goToProfile = () => {
    // Direct navigation to profile page without checking authentication
    // Authentication is already bypassed in ProtectedRoute.jsx
    navigate('/profile');
  };

  return (
    <div className="app">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-left">
          <Link to="/" className="navbar-logo">MOVIGO</Link>
          <div className="navbar-links">
            <Link to="/" className="nav-link">Trang chủ</Link>
            <Link to="/search" className="nav-link">Tìm kiếm</Link>
            <div className="nav-dropdown">
              <span className="nav-link dropdown-trigger">Thể loại</span>
              <div className="dropdown-content">
                <Link to="/?category=action" className="dropdown-item">Hành động</Link>
                <Link to="/?category=comedy" className="dropdown-item">Hài</Link>
                <Link to="/?category=drama" className="dropdown-item">Chính kịch</Link>
                <Link to="/?category=horror" className="dropdown-item">Kinh dị</Link>
                <Link to="/?category=animation" className="dropdown-item">Hoạt hình</Link>
              </div>
            </div>
          </div>
        </div>
        <div className="navbar-right">
          {/* User profile icon */}
          <div className="user-avatar-circle" onClick={goToProfile}>
            <span>👤</span>
          </div>

          {/* 
          {!loading && (
            user ? (
              <div className="user-menu">
                <div className="user-avatar" style={{ backgroundImage: `url(${user.avatar_url || '/default-avatar.png'})` }}>
                  <div className="user-dropdown">
                    <Link to="/profile" className="dropdown-item">Hồ sơ</Link>
                    <Link to="/profile/watchlater" className="dropdown-item">Xem sau</Link>
                    <button onClick={handleLogout} className="dropdown-item logout-button">Đăng xuất</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="auth-button login">Đăng nhập</Link>
                <Link to="/register" className="auth-button register">Đăng ký</Link>
              </div>
            )
          )}
          */}
        </div>
      </nav>

      {/* Main content */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">MOVIGO</div>
          <div className="footer-links">
            <a href="#" className="footer-link">Về chúng tôi</a>
            <a href="#" className="footer-link">Liên hệ</a>
            <a href="#" className="footer-link">Điều khoản sử dụng</a>
            <a href="#" className="footer-link">Chính sách bảo mật</a>
          </div>
          <div className="footer-copyright">
            &copy; {new Date().getFullYear()} Movigo. Đồ án mẫu - Không sử dụng cho mục đích thương mại.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
