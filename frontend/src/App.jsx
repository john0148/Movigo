import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { getCurrentUser, logout, isAuthenticated, checkMongoDBStatus } from './api/authApi';
import { attemptAutoLogin, clearManualLogoutFlag, setManualLogout } from './utils/autoLogin';
import { USER_DATA_KEY } from './config/constants';
import { Search as SearchIcon } from "lucide-react";
import './App.css';
import { genresMovie, yearOptions } from './config/constants';

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
  // Search state variables - synchronized with URL parameters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  // Force refresh user data from localStorage
  const refreshUserFromStorage = () => {
    console.log('Refreshing user data from localStorage...');
    const storedUserData = localStorage.getItem(USER_DATA_KEY);
    // Danh sách từ khóa gợi ý - bạn có thể lấy từ API hoặc định nghĩa tĩnh

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

        // If not on the login or register page, redirect to login
        if (!location.pathname.includes('/login') && !location.pathname.includes('/register')) {
          console.log('Not on login/register page - redirecting to login');
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

        // If not on the login or register page, redirect to login
        if (!location.pathname.includes('/login') && !location.pathname.includes('/register')) {
          navigate('/login');
        }
      }
    };

    checkAuth();
  }, [location.pathname, navigate, location.state]);
  const suggestedKeywords = [
    'Hereditary', 'Hercules', 'Heartland: Season 1', 'He\'s Just Not That Into You',
    'Heart Eyes', 'Heat', 'Hello Kitty\'s Furry Tale Theater', 'Hello Kitty: Super Style!',
    'Hell on Wheels', 'Henry Cavill'
  ];

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

          // If not on login or register page, redirect
          if (!location.pathname.includes('/login') && !location.pathname.includes('/register')) {
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


  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const query = queryParams.get('query') || '';
    const genre = queryParams.get('category') || '';
    const year = queryParams.get('year') || '';

    // Only update state if values are different to prevent unnecessary re-renders
    if (query !== searchQuery) setSearchQuery(query);
    if (genre !== selectedGenre) setSelectedGenre(genre);
    if (year !== selectedYear) setSelectedYear(year);
  }, [location.search]);

  // Load recent searches from localStorage on initial mount
  useEffect(() => {
    const savedSearches = localStorage.getItem('recent_searches');
    if (savedSearches) {
      try {
        setRecentSearches(JSON.parse(savedSearches).slice(0, 5));
      } catch (error) {
        console.error('Error parsing recent searches:', error);
      }
    }
  }, []);

  // Save search to recent searches when performing search
  const saveToRecentSearches = (query) => {
    if (!query) return;

    const updatedSearches = [query, ...recentSearches.filter(item => item !== query)].slice(0, 5);
    setRecentSearches(updatedSearches);
    localStorage.setItem('recent_searches', JSON.stringify(updatedSearches));
  };

  // Handle search form submission
  const handleSearch = () => {
    if (!searchQuery && !selectedGenre && !selectedYear) return;

    const params = new URLSearchParams();
    if (searchQuery) {
      params.set("query", searchQuery);
      saveToRecentSearches(searchQuery);
    }
    if (selectedGenre) params.set("category", selectedGenre);
    if (selectedYear) params.set("year", selectedYear);

    navigate(`/search?${params.toString()}`);
  };

  // Handle Enter key press in search input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Handle search suggestion click
  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    saveToRecentSearches(suggestion);

    const params = new URLSearchParams();
    params.set("query", suggestion);
    if (selectedGenre) params.set("category", selectedGenre);
    if (selectedYear) params.set("year", selectedYear);

    navigate(`/search?${params.toString()}`);
  };

  // Handle genre selection change
  const handleGenreChange = (e) => {
    const genre = e.target.value || '';
    setSelectedGenre(genre);

    const params = new URLSearchParams(location.search);
    if (genre) {
      params.set("category", genre);
    } else {
      params.delete("category");
    }
    if (searchQuery) params.set("query", searchQuery);
    // if (selectedYear) params.set("year", selectedYear);

    navigate(`/search?${params.toString()}`);
  };

  // Handle year selection change
  const handleYearChange = (e) => {
    const year = e.target.value || null;
    setSelectedYear(year);

    const params = new URLSearchParams(location.search);
    if (year) {
      params.set("year", year);
    } else {
      params.delete("year");
    }
    if (searchQuery) params.set("query", searchQuery);
    if (selectedGenre) params.set("category", selectedGenre);

    navigate(`/search?${params.toString()}`);
  };

  // Clear search query
  const clearSearch = () => {
    setSearchQuery('');
    const params = new URLSearchParams(location.search);
    params.delete("query");

    if (params.toString()) {
      navigate(`/search?${params.toString()}`);
    } else {
      setIsFocused(false);
    }
  };

  // Handle input change
  const handleInputChange = (event) => {
    setSearchQuery(event.target.value);
  };


  return (
    <div className="app">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-left">
          <Link to="/" className="navbar-logo">MOVIGO</Link>
          <div className="navbar-links">
            <Link to="/" className="nav-link">Trang chủ</Link>
            {/* <Link to="/search" className="nav-link">Danh sách</Link> */}
            <Link to="/search" className="nav-link">Danh sách</Link>

            {/* Improved Genre dropdown */}
            <div className="genre-select-container">
              <select
                className="genre-select"
                onChange={handleGenreChange}
                value={selectedGenre || ""}
              >
                <option value="" disabled hidden>
                  Thể loại
                </option>
                {genresMovie.map(genre => (
                  <option key={genre.value} value={genre.value}>
                    {genre.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Added Year dropdown */}
            <div className="year-select-container">
              <select
                className="year-select"
                onChange={handleYearChange}
                value={selectedYear || ""}
              >
                {yearOptions.map(year => (
                  <option key={year.value} value={year.value}>
                    {year.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Improved search container */}
            <div className="search-wrapper">
              <div className="search-container">
                <div className="search-icon">
                  <SearchIcon size={18} className="search-icon-svg" />
                </div>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Nhập vào titles"
                  value={searchQuery}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                />
                {searchQuery && (
                  <button
                    className="clear-search-btn"
                    onClick={clearSearch}
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}

                {/* Added search button */}
                <button
                  className="search-button"
                  onClick={handleSearch}
                  aria-label="Search"
                >
                  <SearchIcon size={16} />
                </button>
              </div>

              {/* Enhanced search suggestions */}
              {isFocused && (
                <div className="search-suggestions">
                  {recentSearches.length > 0 && (
                    <div className="recent-searches">
                      <p className="suggestion-title">Recent Searches:</p>
                      <div className="keyword-tags">
                        {recentSearches.map((term, index) => (
                          <span
                            key={`recent-${index}`}
                            className="keyword-tag recent-tag"
                            onClick={() => handleSuggestionClick(term)}
                          >
                            {term}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="explore-section">
                    <p className="suggestion-title">More to explore:</p>
                    <div className="keyword-tags">
                      {suggestedKeywords
                        .filter(keyword => !searchQuery ||
                          keyword.toLowerCase().includes(searchQuery.toLowerCase()))
                        .slice(0, 8)
                        .map((keyword, index) => (
                          <span
                            key={`suggest-${index}`}
                            className="keyword-tag"
                            onClick={() => handleSuggestionClick(keyword)}
                          >
                            {keyword}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User menu section */}

        {/* User menu section */}
        <div className="navbar-right">
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
        <Outlet context={{
          user,
          isLoggedIn,
          refreshUserFromStorage,
          usingFallbackData,
          retryMongoDBConnection,
          // Pass search context to child routes
          searchContext: {
            query: searchQuery,
            genre: selectedGenre,
            year: selectedYear,
            setSearchQuery,
            setSelectedGenre,
            setSelectedYear,
            handleSearch
          }
        }} />
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