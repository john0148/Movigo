import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getWatchLater, removeFromWatchLater } from '../../api/watchHistoryApi';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { BASE_IMAGE_URL } from '../../config/constants';
import LoadingSpinner from '../../components/LoadingSpinner';
import '../../styles/Profile.css';

const WatchLater = () => {
  const [watchList, setWatchList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWatchLater = async () => {
      try {
        setLoading(true);
        const data = await getWatchLater(page);
        if (data.length === 0) {
          setHasMore(false);
        } else {
          setWatchList(prev => page === 1 ? data : [...prev, ...data]);
        }
      } catch (error) {
        console.error('Error fetching watch later list:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchWatchLater();
    }
  }, [user, page]);

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const handleRemove = async (entryId) => {
    try {
      await removeFromWatchLater(entryId);
      setWatchList(prev => prev.filter(item => item.id !== entryId));
    } catch (error) {
      console.error('Error removing from watch later:', error);
    }
  };

  const handleMovieClick = (movieId) => {
    navigate(`/movies/${movieId}`);
  };

  if (loading && page === 1) {
    return <LoadingSpinner />;
  }

  return (
    <div className="watch-later-container">
      <h2>Xem sau</h2>
      {watchList.length === 0 ? (
        <p>Danh sách xem sau trống.</p>
      ) : (
        <>
          <div className="watch-later-list">
            {watchList.map((item) => (
              <div key={item.id} className="watch-later-item">
                <img
                  src={`${BASE_IMAGE_URL}${item.movie_details.poster_path}`}
                  alt={item.movie_details.title}
                  className="movie-thumbnail"
                  onClick={() => handleMovieClick(item.movie_id)}
                  style={{ cursor: 'pointer' }}
                />
                <div className="movie-info">
                  <h3
                    onClick={() => handleMovieClick(item.movie_id)}
                    style={{ cursor: 'pointer', color: '#E50914' }}
                  >
                    {item.movie_details.title}
                  </h3>
                  <p className="added-date">
                    Đã thêm: {formatDistanceToNow(new Date(item.added_at), {
                      addSuffix: true,
                      locale: vi
                    })}
                  </p>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button
                      className="see-more-btn"
                      onClick={() => handleMovieClick(item.movie_id)}
                    >
                      Xem chi tiết
                    </button>
                    <button
                      className="remove-btn"
                      onClick={() => handleRemove(item.id)}
                    >
                      Xóa khỏi danh sách
                    </button>
                  </div>
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

export default WatchLater;