import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { getCurrentUser, logout, isAuthenticated, checkMongoDBStatus } from './api/authApi';
import { attemptAutoLogin, clearManualLogoutFlag, setManualLogout } from './utils/autoLogin';
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
  const [usingFallbackData, setUsingFallbackData] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Force refresh user data from localStorage
  const refreshUserFromStorage = () => {
    console.log('Refreshing user data from localStorage...');
    const storedUserData = localStorage.getItem(USER_DATA_KEY);

    if (storedUserData) {
      try {
        const userData = JSON.parse(storedUserData);
        console.log('Successfully loaded user data from localStorage:', userData.email);

        // Make sure we log the subscription plan
        if (userData.subscription_plan) {
          console.log('User subscription plan:', userData.subscription_plan);
        } else {
          console.warn('User data missing subscription_plan');
        }

        // Kiểm tra xem đang sử dụng dữ liệu fallback hay không
        const token = localStorage.getItem('auth_token');
        setUsingFallbackData(token && token.startsWith('mock-token'));

        // Important: Update the state
        setUser(userData);
        setIsLoggedIn(true);

        console.log('User state updated to logged in');

        return userData;
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        setIsLoggedIn(false);
        setUser(null);
      }
    } else {
      // Nếu không có dữ liệu, đảm bảo state được reset
      console.warn('No user data found in localStorage');
      setUser(null);
      setIsLoggedIn(false);
      setUsingFallbackData(false);
    }
    return null;
  };

  // Thử kết nối lại MongoDB khi đang ở trong ứng dụng
  const retryMongoDBConnection = async () => {
    try {
      const status = await checkMongoDBStatus();

      if (status.status === 'connected') {
        // Nếu kết nối lại thành công, refresh user data
        const userData = await getCurrentUser();
        if (userData) {
          setUser(userData);
          setUsingFallbackData(false);
          // Force reload để đảm bảo toàn bộ ứng dụng sử dụng dữ liệu mới
          window.location.reload();
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error retrying MongoDB connection:', error);
      return false;
    }
  };

  // Add an effect that runs when location changes
  useEffect(() => {
    // This will check authentication status whenever the route changes
    const checkAuth = async () => {
      // Check if we have a manual logout flag
      const manualLogout = localStorage.getItem('manual_logout');

      if (manualLogout) {
        // Ensure we're logged out in the UI
        console.log('Manual logout flag detected during route change - ensuring logged out state');
        setIsLoggedIn(false);
        setUser(null);
        setUsingFallbackData(false);

        // If not on the login page, redirect to login
        if (!location.pathname.includes('/login')) {
          console.log('Not on login page - redirecting to login');
          navigate('/login');
        }
        return;
      }

      // Check if we're coming from the login page with refreshUser state
      if (location.state?.refreshUser) {
        console.log('Coming from login with refreshUser state - forcing user refresh');
        refreshUserFromStorage();
        // Clear the state to prevent repeated refreshes
        window.history.replaceState({}, document.title);
        return;
      }

      // Normal auth checking for authenticated users
      const authenticated = isAuthenticated();
      setIsLoggedIn(authenticated);

      if (authenticated && !user) {
        console.log('User is authenticated but state is missing - refreshing from storage');
        refreshUserFromStorage();
      } else if (!authenticated) {
        console.log('User is not authenticated - clearing state');
        setUser(null);
        setUsingFallbackData(false);

        // If not on the login page, redirect to login
        if (!location.pathname.includes('/login')) {
          navigate('/login');
        }
      }
    };

    checkAuth();
  }, [location.pathname, navigate, location.state]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);

        // Clear the manual logout flag only when the app starts from scratch
        // If it's just a page refresh after logout, we want to keep the flag
        const isFirstLoad = !localStorage.getItem('_app_initialized');

        if (isFirstLoad) {
          // This is the very first time the app is loaded in this browser session
          console.log('First app load detected - initializing app state');
          localStorage.setItem('_app_initialized', 'true');

          // Clear any manual logout flag from previous sessions
          clearManualLogoutFlag();
        } else {
          console.log('App already initialized - keeping existing logout state');
        }

        // Check for manual logout flag first - this is our highest priority check
        const manualLogout = localStorage.getItem('manual_logout');
        if (manualLogout) {
          console.log('Manual logout flag detected - staying logged out');
          setUser(null);
          setIsLoggedIn(false);
          setUsingFallbackData(false);
          setLoading(false);

          // If not on login page, redirect
          if (!location.pathname.includes('/login')) {
            navigate('/login');
          }
          return;
        }

        // Kiểm tra nếu đã có user trong localStorage
        const storedUserData = localStorage.getItem(USER_DATA_KEY);
        if (storedUserData) {
          try {
            const userData = JSON.parse(storedUserData);
            console.log('Found existing user in localStorage:', userData.email);
            console.log('User subscription plan:', userData.subscription_plan);

            // Kiểm tra xem đang sử dụng dữ liệu fallback hay không
            const token = localStorage.getItem('auth_token');
            setUsingFallbackData(token && token.startsWith('mock-token'));

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

              // Kiểm tra xem đang sử dụng dữ liệu fallback hay không
              const token = localStorage.getItem('auth_token');
              setUsingFallbackData(token && token.startsWith('mock-token'));
            } else {
              console.error('User data not found in localStorage after auto-login');
              setIsLoggedIn(false);
              setUsingFallbackData(false);
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
              setUsingFallbackData(false);
            } else {
              console.log('No user data available');
              setUser(null);
              setIsLoggedIn(false);
              setUsingFallbackData(false);
            }
          } catch (error) {
            console.error('Error getting user data:', error);
            setUser(null);
            setIsLoggedIn(false);
            setUsingFallbackData(false);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in fetchUser:', error);
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate, location.pathname]);

  const handleLogout = async () => {
    try {
      console.log('Logging out user');

      // First update the UI state so it's immediate
      setUser(null);
      setIsLoggedIn(false);
      setUsingFallbackData(false);

      // Then call the logout API (which sets manual logout flag)
      await logout();

      // For extra safety, directly set the flag here too
      localStorage.setItem('manual_logout', 'true');

      // Force a hard redirect to login page (not using React Router)
      window.location.href = '/login';
    } catch (error) {
      console.error('Error during logout:', error);

      // Even if there's an error, still try to clean up
      setUser(null);
      setIsLoggedIn(false);
      setUsingFallbackData(false);
      localStorage.setItem('manual_logout', 'true');
      window.location.href = '/login';
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
                  <button onClick={handleLogout} className="dropdown-item logout-button">Đăng xuất</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="main-content">
        <Outlet context={{ user, isLoggedIn, refreshUserFromStorage, usingFallbackData, retryMongoDBConnection }} />
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
