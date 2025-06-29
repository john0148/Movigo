import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { getCurrentUser, isAuthenticated, checkMongoDBStatus } from './api/authApi';
import { useAuth } from './context/AuthContext';
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
  console.log('ENV', {
    API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
    AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID
  });
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoggedIn, logout, isLoading: authLoading } = useAuth();
  
  const [usingFallbackData, setUsingFallbackData] = useState(false);
  
  // Search state variables - synchronized with URL parameters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  
  // Danh sách từ khóa gợi ý
  const suggestedKeywords = [
    'Hereditary', 'Hercules', 'Heartland: Season 1', 'He\'s Just Not That Into You',
    'Heart Eyes', 'Heat', 'Hello Kitty\'s Furry Tale Theater', 'Hello Kitty: Super Style!',
    'Hell on Wheels', 'Henry Cavill'
  ];

  // Force refresh user data from localStorage for fallback support
  const refreshUserFromStorage = () => {
    console.log('Refreshing user data from localStorage...');
    const storedUserData = localStorage.getItem(USER_DATA_KEY);

    if (storedUserData) {
      try {
        const userData = JSON.parse(storedUserData);
        console.log('Successfully loaded user data from localStorage:', userData.email);

        // Kiểm tra xem đang sử dụng dữ liệu fallback hay không
        const token = localStorage.getItem('auth_token');
        setUsingFallbackData(token && token.startsWith('mock-token'));

        return userData;
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
      }
    } else {
      console.warn('No user data found in localStorage');
      setUsingFallbackData(false);
    }
    return null;
  };

  // Thử kết nối lại MongoDB khi đang ở trong ứng dụng
  const retryMongoDBConnection = async () => {
    try {
      const status = await checkMongoDBStatus();

      if (status.status === 'connected') {
        setUsingFallbackData(false);
        window.location.reload();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error retrying MongoDB connection:', error);
      return false;
    }
  };

  // Check fallback data usage on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token && token.startsWith('mock-token')) {
      setUsingFallbackData(true);
    }
  }, []);

  const handleLogout = async () => {
    try {
      console.log('Logging out user');
      await logout();
      setUsingFallbackData(false);
      navigate('/login');
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

  // Show loading if Firebase is still checking auth
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-white">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-left">
          <Link to="/" className="navbar-logo">MOVIGO</Link>
          <div className="navbar-links">
            <Link to="/" className="nav-link">Trang chủ</Link>
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
        <div className="navbar-right">
          <div className="user-menu">
            <div className="user-avatar" onClick={goToProfile}>
              <span>👤 {isLoggedIn ? (user?.display_name || user?.email || user?.full_name || 'User') : 'Đăng nhập'}</span>
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