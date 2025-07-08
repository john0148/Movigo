import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
// import { getWatchLater, removeFromWatchLater } from '../../api/watchHistoryApi';
import { getWatchLaterList, removeFromWatchLater } from '../../api/watchHistoryApi';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import LoadingSpinner from '../../components/LoadingSpinner';
import '../../styles/Profile.css';
import { baseImageUrl } from '../../config/constants';
import { Link } from 'react-router-dom';

const WatchLater = () => {
  const [watchList, setWatchList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { user } = useAuth();
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    const fetchWatchLater = async () => {
      try {
        setLoading(true);
        const data = await getWatchLaterList();

        const uniqueData = data.filter(item => !watchList.some(p => p.id === item.id));

        if (page === 1) {
          setWatchList(data);
          setHasMore(data.length > 0);
        } else {
          setWatchList(prev => [...prev, ...uniqueData]);
          if (uniqueData.length === 0) {
            setHasMore(false);
          }
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

  const handleRemove = async (movieId) => {
    try {
      await removeFromWatchLater(movieId);
      setWatchList(prev => prev.filter(item => item.id !== movieId));
    } catch (error) {
      console.error('Error removing from watch later:', error);
    }
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
                  src={`${baseImageUrl}${item.poster_path}`}
                  alt={item.title}
                  className="movie-thumbnail"
                />
                <div className="movie-info">
                  {/* <h3>{item.movie_details.title}</h3> */}
                    <h3>
                      <Link to={`/movies/${item.id}`} className="movie-title-link">
                        {item.title}
                      </Link>
                    </h3>

                  {/* <p className="added-date">
                    {item.added_date && !isNaN(new Date(item.added_date)) ? (
                      `Đã thêm: ${formatDistanceToNow(new Date(item.added_date), {
                        addSuffix: true,
                        locale: vi,
                      })}`
                    ) : (
                      'Thời gian không xác định'
                    )}
                  </p> */}

                  <button
                    className="remove-btn"
                    onClick={() => handleRemove(item.id)} // đúng movie_id
                    disabled={removingId === item.id}
                  >
                    {removingId === item.id ? 'Đang xóa...' : 'Xóa khỏi danh sách'}
                  </button>


                </div>
              </div>
            ))}


          </div>
        </>
      )}

      {watchList.length > 0 && (
        hasMore ? (
          <button
            className="load-more-btn"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? 'Đang tải...' : 'Xem thêm'}
          </button>
        ) : (
          <p className="no-more-movies">Không còn phim nào để hiển thị.</p>
        )
      )}
    </div>
  );
};

export default WatchLater;