import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Search as SearchIcon, Filter, X, ChevronDown, Sparkles, TrendingUp, Film, Clock } from 'lucide-react';
import { searchMovies } from '../api/movieApi';
import MovieItem from '../components/MovieItem';
import '../styles/Search.css';

export default function Search() {
  const location = useLocation();
  const navigate = useNavigate();
  const { searchContext } = useOutletContext() || { searchContext: {} };

  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [activeFilters, setActiveFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const limit = 20;

  // Extract search parameters from URL
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const query = queryParams.get('query') || '';
    const genre = queryParams.get('category') || null;
    const yearParam = queryParams.get('year') || null;
    const year = yearParam ?
      (yearParam.endsWith('s') ? yearParam : parseInt(yearParam, 10)) : null;

    // Track active filters for UI display
    const filters = {};
    if (query) filters.query = query;
    if (genre) filters.genre = genre;
    if (yearParam) filters.year = yearParam;

    setActiveFilters(filters);
    setPage(1);

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log('Fetching data with params:', { query, genre, year, skip: 0, limit });
        const data = await searchMovies(query, genre, year, 1, limit);
        console.log('Received data:', data);

        if (data && data.results) {
          setResults(data.results);
          setTotalResults(data.total || data.results.length);
        } else if (Array.isArray(data)) {
          setResults(data);
          setTotalResults(data.length);
        } else {
          setResults([]);
          setTotalResults(0);
        }
      } catch (err) {
        console.error("Error fetching search results:", err);
        setError('Đã xảy ra lỗi khi tìm kiếm phim');
      } finally {
        setIsLoading(false);
      }
    };

    if (Object.keys(filters).length > 0) {
      fetchData();
    } else {
      fetchPopularMovies();
    }
  }, [location.search]);

  // Handle pagination - load more results
  useEffect(() => {
    if (page === 1) return;

    const loadMoreResults = async () => {
      setIsLoading(true);

      try {
        const queryParams = new URLSearchParams(location.search);
        const query = queryParams.get('query') || '';
        const genre = queryParams.get('category') || null;
        const yearParam = queryParams.get('year') || null;
        const year = yearParam ?
          (yearParam.endsWith('s') ? yearParam : parseInt(yearParam, 10)) : null;

        const data = await searchMovies(query, genre, year, page, limit);

        if (data && Array.isArray(data.results)) {
          setResults(prevResults => [...prevResults, ...data.results]);
        } else if (data && Array.isArray(data)) {
          setResults(prevResults => [...prevResults, ...data]);
        }
      } catch (err) {
        console.error("Error loading more results:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMoreResults();
  }, [page]);

  // Load popular/trending movies when no search is active
  const fetchPopularMovies = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await searchMovies("", "popular", null, 1, limit);

      if (data && Array.isArray(data.results)) {
        setResults(data.results);
        setTotalResults(data.total || data.results.length);
      } else if (data && Array.isArray(data)) {
        setResults(data);
        setTotalResults(data.length);
      } else {
        setResults([]);
        setTotalResults(0);
      }
    } catch (err) {
      console.error("Error fetching popular movies:", err);
      setError('Đã xảy ra lỗi khi tải phim phổ biến');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoadMore = () => {
    setPage(prevPage => prevPage + 1);
  };

  const removeFilter = (filterType) => {
    const queryParams = new URLSearchParams(location.search);

    switch (filterType) {
      case 'query':
        queryParams.delete('query');
        break;
      case 'genre':
        queryParams.delete('category');
        break;
      case 'year':
        queryParams.delete('year');
        break;
      default:
        break;
    }

    navigate(`/search${queryParams.toString() ? '?' + queryParams.toString() : ''}`);
  };

  const clearAllFilters = () => {
    navigate('/search');
  };

  const totalPages = Math.ceil(totalResults / limit);

  // Get display names for filters
  const getGenreDisplayName = (genreCode) => {
    const genreMap = {
      'action': 'Hành động',
      'comedy': 'Hài',
      'drama': 'Chính kịch',
      'horror': 'Kinh dị',
      'animation': 'Hoạt hình',
      'sci-fi': 'Khoa học viễn tưởng',
      'romance': 'Lãng mạn'
    };

    return genreMap[genreCode] || genreCode;
  };

  const getYearDisplayName = (yearParam) => {
    if (!yearParam) return '';

    const yearMap = {
      '2010s': '2010-2019',
      '2000s': '2000-2009',
      '1990s': '1990-1999',
      'classic': 'Trước 1990'
    };

    return yearMap[yearParam] || yearParam;
  };

  const popularSuggestions = [
    { label: 'Avengers', query: 'avengers', icon: '🦸' },
    { label: 'Batman', query: 'batman', icon: '🦇' },
    { label: 'Hành động', category: 'action', icon: '💥' },
    { label: 'Hài kịch', category: 'comedy', icon: '😄' },
    { label: 'Kinh dị', category: 'horror', icon: '👻' },
    { label: 'Lãng mạn', category: 'romance', icon: '💕' },
  ];

  return (
    <div className="modern-search-page">
      {/* Hero Header */}
      <div className="search-hero">
        <div className="search-hero-content">
          <div className="search-header-main">
            <SearchIcon className="search-hero-icon" />
            <div className="search-title-section">
              <h1 className="search-hero-title">
                {activeFilters.query ? `"${activeFilters.query}"` :
                  activeFilters.genre ? getGenreDisplayName(activeFilters.genre) :
                    'Khám phá phim'}
              </h1>
              <p className="search-subtitle">
                {totalResults > 0 ? `${totalResults} kết quả được tìm thấy` : 'Tìm kiếm bộ phim yêu thích của bạn'}
              </p>
            </div>
          </div>

          {/* Active Filters */}
          {Object.keys(activeFilters).length > 0 && (
            <div className="modern-filters-container">
              <div className="filters-header">
                <Filter className="filter-icon" />
                <span className="filters-label">Bộ lọc đang áp dụng:</span>
                <button
                  className="toggle-filters-btn"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <ChevronDown className={`chevron ${showFilters ? 'rotated' : ''}`} />
                </button>
              </div>

              <div className={`filter-tags-container ${showFilters ? 'expanded' : ''}`}>
                <div className="filter-tags">
                  {activeFilters.query && (
                    <div className="modern-filter-tag query-tag">
                      <SearchIcon size={16} />
                      <span>"{activeFilters.query}"</span>
                      <button
                        className="remove-filter-btn"
                        onClick={() => removeFilter('query')}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}

                  {activeFilters.genre && (
                    <div className="modern-filter-tag genre-tag">
                      <Film size={16} />
                      <span>{getGenreDisplayName(activeFilters.genre)}</span>
                      <button
                        className="remove-filter-btn"
                        onClick={() => removeFilter('genre')}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}

                  {activeFilters.year && (
                    <div className="modern-filter-tag year-tag">
                      <Clock size={16} />
                      <span>{getYearDisplayName(activeFilters.year)}</span>
                      <button
                        className="remove-filter-btn"
                        onClick={() => removeFilter('year')}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}

                  {Object.keys(activeFilters).length > 1 && (
                    <button
                      className="clear-all-btn"
                      onClick={clearAllFilters}
                    >
                      <X size={16} />
                      Xóa tất cả
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="search-main-content">
        {/* Loading State */}
        {isLoading && page === 1 && (
          <div className="modern-loading-container">
            <div className="loading-animation">
              <div className="loading-circle"></div>
              <div className="loading-circle delay-1"></div>
              <div className="loading-circle delay-2"></div>
            </div>
            <p className="loading-text">Đang tìm kiếm phim hay cho bạn...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="modern-error-container">
            <div className="error-icon">⚠️</div>
            <h3>Oops! Có lỗi xảy ra</h3>
            <p className="error-message">{error}</p>
            <button className="retry-button" onClick={() => window.location.reload()}>
              <TrendingUp size={16} />
              Thử lại
            </button>
          </div>
        )}

        {/* Results */}
        {!isLoading && !error && (
          <>
            {results && results.length > 0 ? (
              <div className="search-results-section">
                {/* Results Header */}
                <div className="results-header">
                  <div className="results-info">
                    <h2>Kết quả tìm kiếm</h2>
                    <span className="results-count">{totalResults} phim</span>
                  </div>
                </div>

                {/* Results Grid */}
                <div className="modern-search-results">
                  {results.map((movie, index) => (
                    <div key={`${movie.id || ''}-${index}`} className="movie-item-wrapper">
                      <MovieItem
                        movie={movie}
                        displayMode="grid"
                        showDetails={true}
                        onMovieClick={(id) => {
                          navigate(`/movies/${id}`);
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Load More Indicator */}
                {isLoading && page > 1 && (
                  <div className="loading-more-container">
                    <div className="loading-spinner-small"></div>
                    <p>Đang tải thêm phim...</p>
                  </div>
                )}

                {/* Load More Button */}
                {totalPages > 1 && page < totalPages && (
                  <div className="load-more-section">
                    <button
                      className="modern-load-more-btn"
                      onClick={handleLoadMore}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <div className="button-spinner"></div>
                          Đang tải...
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          Xem thêm phim
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* No Results State */
              <div className="modern-no-results">
                <div className="no-results-animation">
                  <div className="search-icon-large">🔍</div>
                  <div className="search-ripples">
                    <div className="ripple"></div>
                    <div className="ripple delay-1"></div>
                    <div className="ripple delay-2"></div>
                  </div>
                </div>

                <div className="no-results-content">
                  <h3>Không tìm thấy kết quả</h3>
                  <p className="no-results-message">
                    {activeFilters.query
                      ? `Không tìm thấy phim nào với từ khóa "${activeFilters.query}"`
                      : "Thử tìm kiếm với từ khóa khác hoặc khám phá các gợi ý bên dưới"
                    }
                  </p>

                  <div className="search-suggestions-section">
                    <h4>
                      <Sparkles className="suggestion-icon" />
                      Gợi ý cho bạn
                    </h4>
                    <div className="suggestion-grid">
                      {popularSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          className="suggestion-card"
                          onClick={() => {
                            if (suggestion.query) {
                              navigate(`/search?query=${suggestion.query}`);
                            } else if (suggestion.category) {
                              navigate(`/search?category=${suggestion.category}`);
                            }
                          }}
                        >
                          <span className="suggestion-icon">{suggestion.icon}</span>
                          <span className="suggestion-label">{suggestion.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
