import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getWatchHistory } from '../../api/watchHistoryApi';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { BASE_IMAGE_URL } from '../../config/constants';
import LoadingSpinner from '../../components/LoadingSpinner';
import '../../styles/Profile.css';

const WatchHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWatchHistory = async () => {
      try {
        setLoading(true);
        const data = await getWatchHistory(page);
        if (data.length === 0) {
          setHasMore(false);
        } else {
          setHistory(prev => page === 1 ? data : [...prev, ...data]);
        }
      } catch (error) {
        console.error('Error fetching watch history:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchWatchHistory();
    }
  }, [user, page]);

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const formatWatchTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const handleMovieClick = (movieId) => {
    navigate(`/movies/${movieId}`);
  };

  if (loading && page === 1) {
    return <LoadingSpinner />;
  }

  return (
    <div className="watch-history-container">
      <h2>Lịch sử xem phim</h2>
      {history.length === 0 ? (
        <p>Bạn chưa xem phim nào.</p>
      ) : (
        <>
          <div className="watch-history-list">
            {history.map((item) => (
              <div key={item.id} className="watch-history-item">
                <img
                  src={`${BASE_IMAGE_URL}${item.movie_details.poster_path}`}
                  alt={item.movie_details.title}
                  className="movie-thumbnail"
                  onClick={() => handleMovieClick(item.movie_id)}
                  style={{ cursor: 'pointer' }}
                />
                <div className="watch-info">
                  <h3
                    onClick={() => handleMovieClick(item.movie_id)}
                    style={{ cursor: 'pointer', color: '#E50914' }}
                  >
                    {item.movie_details.title}
                  </h3>
                  <p>Đã xem: {item.progress_percent}%</p>
                  <p>Thời lượng đã xem: {formatWatchTime(item.watch_duration)}</p>
                  <p className="watch-date">
                    {formatDistanceToNow(new Date(item.watched_at), {
                      addSuffix: true,
                      locale: vi
                    })}
                  </p>
                  <button
                    className="see-more-btn"
                    onClick={() => handleMovieClick(item.movie_id)}
                  >
                    Xem chi tiết
                  </button>
                </div>
              </div>
            ))}
          </div>
          {hasMore && (
            <button
              className="load-more-btn"
              onClick={loadMore}
              disabled={loading}
            >
              {loading ? 'Đang tải...' : 'Xem thêm'}
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default WatchHistory;