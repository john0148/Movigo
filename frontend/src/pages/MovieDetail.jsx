import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMovieDetails, fetchRelatedMovies, incrementMovieView } from '../api/movieApi';
import MovieList from '../components/MovieList/MovieList';
import '../styles/MovieDetail.css';

/**
 * MovieDetail Component
 * Trang chi tiết phim, hiển thị:
 * 1. Banner lớn với thông tin chi tiết phim
 * 2. Nút "Xem phim" để xem phim
 * 3. Thông tin phim (thể loại, ngày phát hành, thời lượng)
 * 4. Danh sách phim liên quan
 */
const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [relatedMovies, setRelatedMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Lấy thông tin chi tiết phim
        const movieData = await getMovieDetails(id);
        setMovie(movieData);
        
        // Tăng lượt xem phim
        await incrementMovieView(id);
        
        // Lấy danh sách phim liên quan
        const related = await fetchRelatedMovies(id, 6);
        setRelatedMovies(related);
      } catch (err) {
        setError('Không thể tải thông tin phim');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleWatchMovie = () => {
    navigate(`/watch/${id}`);
  };

  if (loading) {
    return <div className="movie-detail-loading">Đang tải thông tin phim...</div>;
  }

  if (error || !movie) {
    return <div className="movie-detail-error">{error || 'Không tìm thấy thông tin phim'}</div>;
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const formatRuntime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
  };

  return (
    <div className="movie-detail-container">
      {/* Banner chi tiết phim */}
      <div 
        className="movie-backdrop" 
        style={{ backgroundImage: `url(${movie.backdrop_url || movie.poster_url})` }}
      >
        <div className="backdrop-overlay">
          <div className="movie-detail-content">
            <h1 className="movie-title">{movie.title}</h1>
            
            <div className="movie-meta">
              <span className="movie-rating">{movie.rating ? `${movie.rating}/10` : 'N/A'}</span>
              <span className="movie-year">{new Date(movie.release_date).getFullYear()}</span>
              <span className="movie-runtime">{formatRuntime(movie.duration)}</span>
            </div>
            
            <p className="movie-description">{movie.description}</p>
            
            <div className="movie-genres">
              {movie.genres.map((genre, index) => (
                <span key={index} className="genre-tag">{genre}</span>
              ))}
            </div>
            
            <div className="movie-actions">
              <button 
                className="watch-button primary" 
                onClick={handleWatchMovie}
              >
                <i className="play-icon"></i> Xem phim
              </button>
              <button className="watch-later-button">
                <i className="plus-icon"></i> Xem sau
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Thông tin chi tiết */}
      <div className="movie-info-section">
        <div className="movie-info-container">
          <div className="movie-info-item">
            <h3>Ngày phát hành</h3>
            <p>{formatDate(movie.release_date)}</p>
          </div>
          <div className="movie-info-item">
            <h3>Thời lượng</h3>
            <p>{formatRuntime(movie.duration)}</p>
          </div>
          <div className="movie-info-item">
            <h3>Lượt xem</h3>
            <p>{movie.view_count.toLocaleString()}</p>
          </div>
        </div>
      </div>
      
      {/* Phim liên quan */}
      <div className="related-movies-section">
        <h2>Phim tương tự</h2>
        <div className="related-movies-container">
          {relatedMovies.map(relatedMovie => (
            <div 
              key={relatedMovie.id} 
              className="related-movie-item"
              onClick={() => navigate(`/movies/${relatedMovie.id}`)}
            >
              <img 
                src={relatedMovie.poster_url} 
                alt={relatedMovie.title} 
                className="related-movie-poster"
              />
              <div className="related-movie-info">
                <h3>{relatedMovie.title}</h3>
                <p>{new Date(relatedMovie.release_date).getFullYear()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MovieDetail; 