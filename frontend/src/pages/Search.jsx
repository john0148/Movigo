
/**
 * Search Page Component
 *
 * Hiển thị kết quả tìm kiếm 
 */

import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { useEffect, useState } from 'react';
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
  const limit = 20;

  // Extract search parameters from URL
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const query = queryParams.get('query') || '';
    const genre = queryParams.get('category') || null;
    const yearParam = queryParams.get('year') || null;
    // Chuyển đổi yearParam thành year (thêm dòng này)
    const year = yearParam ?
      (yearParam.endsWith('s') ? yearParam : parseInt(yearParam, 10)) : null;

    // Track active filters for UI display
    const filters = {};
    if (query) filters.query = query;
    if (genre) filters.genre = genre;
    if (yearParam) filters.year = yearParam;

    setActiveFilters(filters);

    // Reset page to 1 when search parameters change
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
      // If no search parameters, load trending or popular movies instead
      fetchPopularMovies();
    }
  }, [location.search]);

  // Handle pagination - load more results
  useEffect(() => {
    // Skip first page since it's loaded by the previous effect
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

        // Append new results to existing results
        if (data && Array.isArray(data.results)) {
          setResults(prevResults => [...prevResults, ...data.results]);
        } else if (data && Array.isArray(data)) {
          setResults(prevResults => [...prevResults, ...data]);
        }
      } catch (err) {
        console.error("Error loading more results:", err);
        // Don't set error state here to keep showing existing results
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
      // You would need to implement this API method
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

    // Update URL with remaining filters
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

  return (
    <div className="search-page">
      <div className="search-header">
        <h1 className="search-title">
          {activeFilters.query ? `Kết quả tìm kiếm cho "${activeFilters.query}"` :
            activeFilters.genre ? `Thể loại: ${getGenreDisplayName(activeFilters.genre)}` :
              'Phim phổ biến'}
          {totalResults > 0 && <span className="result-count"> ({totalResults} kết quả)</span>}
        </h1>

        {/* Active filters display */}
        {Object.keys(activeFilters).length > 0 && (
          <div className="active-filters">
            <span className="filters-label">Lọc theo:</span>
            <div className="filter-tags">
              {activeFilters.query && (
                <div className="filter-tag">
                  <span>Từ khóa: {activeFilters.query}</span>
                  <button
                    className="remove-filter"
                    onClick={() => removeFilter('query')}
                    aria-label="Remove query filter"
                  >×</button>
                </div>
              )}

              {activeFilters.genre && (
                <div className="filter-tag">
                  <span>Thể loại: {getGenreDisplayName(activeFilters.genre)}</span>
                  <button
                    className="remove-filter"
                    onClick={() => removeFilter('genre')}
                    aria-label="Remove genre filter"
                  >×</button>
                </div>
              )}

              {activeFilters.year && (
                <div className="filter-tag">
                  <span>Năm: {getYearDisplayName(activeFilters.year)}</span>
                  <button
                    className="remove-filter"
                    onClick={() => removeFilter('year')}
                    aria-label="Remove year filter"
                  >×</button>
                </div>
              )}

              {Object.keys(activeFilters).length > 1 && (
                <button
                  className="clear-all-filters"
                  onClick={clearAllFilters}
                >
                  Xóa tất cả
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {isLoading && page === 1 && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tìm kiếm...</p>
        </div>
      )}

      {error && (
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button className="retry-btn" onClick={() => window.location.reload()}>
            Thử lại
          </button>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {results && results.length > 0 ? (
            <>
              <div className="search-results">
                {results.map((movie, index) => (
                  <MovieItem
                    key={`${movie.id || ''}-${index}`}
                    movie={movie}
                    displayMode="grid"
                    showDetails={true}
                    onMovieClick={(id) => {
                      navigate(`/movies/${id}`);
                    }}
                  />
                ))}
              </div>

              {/* Loading indicator for "Load More" */}
              {isLoading && page > 1 && (
                <div className="loading-more">
                  <div className="loading-spinner-small"></div>
                  <p>Đang tải thêm...</p>
                </div>
              )}

              {/* Pagination options: Traditional or Infinite Scroll */}
              {totalPages > 1 && page < totalPages && (
                <div className="load-more-container">
                  <button
                    className="load-more-btn"
                    onClick={handleLoadMore}
                    disabled={isLoading || page >= totalPages}
                  >
                    Tải thêm
                  </button>
                </div>
              )}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="pagination-btn"
                    disabled={page === 1}
                    onClick={() => handlePageChange(page - 1)}
                  >
                    &laquo; Trang trước
                  </button>

                  <span className="pagination-info">
                    Trang {page} / {totalPages}
                  </span>

                  <button
                    className="pagination-btn"
                    disabled={page === totalPages}
                    onClick={() => handlePageChange(page + 1)}
                  >
                    Trang tiếp &raquo;
                  </button>
                </div>
              )}
            </>
          ) : (
            activeFilters.query && (
              // <div className="no-results">
              //   <div className="no-results-icon">🔍</div>
              //   <h3>Không tìm thấy kết quả cho "{activeFilters.query}"</h3>
              //   <p className="no-results-message">
              //     Rất tiếc, chúng tôi không tìm thấy bất kỳ phim nào phù hợp với từ khóa tìm kiếm của bạn.
              //   </p>
              //   <div className="search-suggestions">
              //     <h4>Gợi ý:</h4>
              //     <ul>
              //       <li>Kiểm tra lỗi chính tả</li>
              //       <li>Thử sử dụng ít từ khóa hơn</li>
              //       <li>Thử sử dụng từ khóa khác</li>
              //     </ul>
              //   </div>

              //   <div className="popular-suggestions">
              //     <h4>Hoặc khám phá các phim phổ biến:</h4>
              //     <div className="popular-tags">
              //       <button onClick={() => navigate('/search?query=avengers')}>Avengers</button>
              //       <button onClick={() => navigate('/search?query=batman')}>Batman</button>
              //       <button onClick={() => navigate('/search?category=action')}>Hành động</button>
              //       <button onClick={() => navigate('/search?category=comedy')}>Hài</button>
              //     </div>
              //   </div>
              // </div>


              
              <div className="no-results-wrapper">
                <div className="no-results">
                  <div className="no-results-icon">🔍</div>
                  <h3>Không tìm thấy kết quả cho "{activeFilters.query}"</h3>
                  <p className="no-results-message">
                    Rất tiếc, chúng tôi không tìm thấy bất kỳ phim nào phù hợp với từ khóa tìm kiếm của bạn.
                  </p>
                </div>
              
              
                  <div className="search-suggestions">
                    <h4>Gợi ý:</h4>
                    <ul>
                      <li>Kiểm tra lỗi chính tả</li>
                      <li>Thử sử dụng ít từ khóa hơn</li>
                      <li>Thử sử dụng từ khóa khác</li>
                    </ul>
                  </div>                  

                  <div className="popular-suggestions">
                    <h4>Hoặc khám phá các phim phổ biến:</h4>
                    <div className="popular-tags">
                      <button onClick={() => navigate('/search?query=avengers')}>Avengers</button>
                      <button onClick={() => navigate('/search?query=batman')}>Batman</button>
                      <button onClick={() => navigate('/search?category=action')}>Hành động</button>
                      <button onClick={() => navigate('/search?category=comedy')}>Hài</button>
                    </div>
                  </div>

              </div>

            )
          )}
        </>
      )}
    </div>
  );
}