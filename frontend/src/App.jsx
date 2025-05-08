import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { getCurrentUser, logout, isAuthenticated } from './api/authApi';
import { attemptAutoLogin } from './utils/autoLogin';
import { USER_DATA_KEY } from './config/constants';
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Force refresh user data from localStorage
  const refreshUserFromStorage = () => {
    const storedUserData = localStorage.getItem(USER_DATA_KEY);
    if (storedUserData) {
      try {
        const userData = JSON.parse(storedUserData);
        console.log('Refreshed user data from localStorage:', userData);
        setUser(userData);
        setIsLoggedIn(true);
        return userData;
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        setIsLoggedIn(false);
      }
    } else {
      // Nếu không có dữ liệu, đảm bảo state được reset
      setUser(null);
      setIsLoggedIn(false);
    }
    return null;
  };

  // Add an effect that runs when location changes
  useEffect(() => {
    // This will check authentication status whenever the route changes
    const checkAuth = async () => {
      const authenticated = isAuthenticated();
      setIsLoggedIn(authenticated);

      if (authenticated && !user) {
        refreshUserFromStorage();
      } else if (!authenticated) {
        setUser(null);
      }
    };

    checkAuth();
  }, [location.pathname]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);

        // Kiểm tra nếu đã có user trong localStorage
        const storedUserData = localStorage.getItem(USER_DATA_KEY);
        if (storedUserData) {
          try {
            const userData = JSON.parse(storedUserData);
            console.log('Found existing user in localStorage:', userData.email);
            setUser(userData);
            setIsLoggedIn(true);
            setLoading(false);
            return;
          } catch (error) {
            console.error('Error parsing user data from localStorage:', error);
          }
        }

        // Chỉ tự động đăng nhập khi không có người dùng nào
        console.log('No user found in localStorage, attempting auto-login');
        const loginResult = await attemptAutoLogin();

        if (loginResult) {
          // Wait a moment for localStorage to update
          setTimeout(() => {
            const userData = refreshUserFromStorage();
            if (userData) {
              console.log('Auto-login successful, user data loaded:', userData.email);
              setIsLoggedIn(true);
            } else {
              console.error('User data not found in localStorage after auto-login');
              setIsLoggedIn(false);
            }
            setLoading(false);
          }, 200);
        } else {
          console.error('Auto-login failed, trying to load user data anyway');
          try {
            const userData = await getCurrentUser();
            if (userData) {
              console.log('User data from getCurrentUser():', userData.email);
              setUser(userData);
              setIsLoggedIn(true);
            } else {
              console.log('No user data available');
              setUser(null);
              setIsLoggedIn(false);
            }
          } catch (error) {
            console.error('Error getting user data:', error);
            setUser(null);
            setIsLoggedIn(false);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in fetchUser:', error);
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setIsLoggedIn(false);

      // Sử dụng window.location.href thay vì navigate để tải lại trang
      window.location.href = '/login';
    } catch (error) {
      console.error('Error during logout:', error);
      navigate('/login');
    }
  };

  // Function to navigate to profile page
  const goToProfile = () => {
    if (isLoggedIn) {
      navigate('/profileMain');
    } else {
      navigate('/login');
    }
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
          {/* User menu section */}
          <div className="user-menu">
            <div className="user-avatar" onClick={goToProfile}>
              <span>👤 {user ? user.full_name : 'Đăng nhập'}</span>
              {isLoggedIn && (
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
        <Outlet context={{ user, isLoggedIn, refreshUserFromStorage }} />
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
