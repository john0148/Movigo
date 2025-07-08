import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getWatchHistory } from '../../api/watchHistoryApi';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import LoadingSpinner from '../../components/LoadingSpinner';
import '../../styles/Profile.css';
import { baseImageUrl } from '../../config/constants';

const WatchHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { user } = useAuth();

  // useEffect(() => {
  //   const fetchWatchHistory = async () => {
  //     try {
  //       setLoading(true);
  //       const data = await getWatchHistory(page);
  //       if (data.length === 0) {
  //         setHasMore(false);
  //       } else {
  //         setHistory(prev => page === 1 ? data : [...prev, ...data]);
  //       }
  //     } catch (error) {
  //       console.error('Error fetching watch history:', error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   if (user) {
  //     fetchWatchHistory();
  //   }
  // }, [user, page]);


  useEffect(() => {
    const fetchWatchHistory = async () => {
      try {
        setLoading(true);
        const data = await getWatchHistory(page);

        const processedData = data.map((item) => {
          const { _id, ...rest } = item;
          return { ...rest, id: _id };
        });

        console.log('📦 Dữ liệu lịch sử nhận được từ API:', processedData);

        if (processedData.length === 0) {
          setHasMore(false);
        } else {
          setHistory(prev => {
            const updated = page === 1 ? processedData : [...prev, ...processedData];
            console.log('🧩 Danh sách history sau khi cập nhật:', updated);
            return updated;
          });
        }
      } catch (error) {
        console.error('❌ Lỗi lấy lịch sử xem phim:', error);
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
              <div key={item._id} className="watch-history-item">
                <img
                  src={`${baseImageUrl}${item.movie_details.poster_url}`}
                  alt={item.movie_details.title}
                  className="movie-thumbnail"
                />
                <div className="watch-info">
                  <h3>{item.movie_details.title}</h3>
                  <p>Đã xem: {item.progress_percent ?? 0}%</p>
                  <p>Thời lượng đã xem: {formatWatchTime(item.watch_duration ?? 0)}</p>
                  {/* <p className="watch-date">
                    {formatDistanceToNow(new Date(item.watched_at), {
                      addSuffix: true,
                      locale: vi
                    })}
                  </p> */}

                  <p className="watch-date">
                    {item.watched_at
                      ? formatDistanceToNow(new Date(item.watched_at), {
                          addSuffix: true,
                          locale: vi,
                        })
                      : 'Thời gian không xác định'}
                  </p>

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