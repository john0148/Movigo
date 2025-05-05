import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { getCurrentUser, logout } from './api/authApi';
import { attemptAutoLogin, isAutoLoginEnabled } from './utils/autoLogin';
import './App.css';

/**
 * App Component
 * Component gốc của ứng dụng, bao gồm:
 * - Navbar cho điều hướng
 * - Quản lý trạng thái đăng nhập toàn cục
 * - Container cho các routes con
 */
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // First check if we have a current user
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.log('Not logged in, attempting auto-login');

        // If auto-login is enabled, try to log in
        if (isAutoLoginEnabled()) {
          const loginResult = await attemptAutoLogin();
          if (loginResult) {
            // If auto-login was successful, fetch the user data
            try {
              const userData = await getCurrentUser();
              setUser(userData);
            } catch (autoLoginError) {
              console.error('Error getting user after auto-login:', autoLoginError);
              setUser(null);
            }
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
    navigate('/login');
  };

  // Function to navigate to profile page
  const goToProfile = () => {
    navigate('/profileMain');
  };

  // Handle genre selection
  const handleGenreChange = (e) => {
    if (e.target.value) {
      navigate(`/?category=${e.target.value}`);
    }
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
            <div className="genre-select-container">
              <select
                className="genre-select"
                onChange={handleGenreChange}
                defaultValue=""
              >
                <option value="" disabled>Thể loại</option>
                <option value="action">Hành động</option>
                <option value="comedy">Hài</option>
                <option value="drama">Chính kịch</option>
                <option value="horror">Kinh dị</option>
                <option value="animation">Hoạt hình</option>
              </select>
            </div>
          </div>
        </div>
        <div className="navbar-right">
          {/* Always show user icon, regardless of login status */}
          <div className="user-menu">
            <div className="user-avatar" onClick={goToProfile}>
              <span>👤 {user ? user.full_name : 'User'}</span>
              {user && (
                <div className="user-dropdown">
                  <Link to="/profileMain" className="dropdown-item">Hồ sơ</Link>
                  <Link to="/profile/watchlater" className="dropdown-item">Xem sau</Link>
                  <button onClick={handleLogout} className="dropdown-item logout-button">Đăng xuất</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="main-content">
        <Outlet context={{ user }} />
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
