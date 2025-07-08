import { useState, useEffect } from 'react';
import { useParams,useNavigate  } from 'react-router-dom';

import { Heart, Calendar, Clock, Eye, Play, Star, ArrowRight, Users, Award } from 'lucide-react';
import '../styles/MovieDetail.css'; // Import file CSS
import { getMovieDetails, fetchRelatedMovies, incrementMovieView } from '../api/movieApi';
import { baseImageUrl } from '../config/constants';
import { MovieRatings } from '../components/MovieDetail/MovieRatings'
import { MovieCharacters } from '../components/MovieDetail/MovieCharacters';
import { getUserProfile } from '../api/userApi';
const MovieDetail = () => {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [movie, setMovie] = useState(null);
  const [relatedMoviesData, setRelatedMoviesData] = useState([]);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewStars, setReviewStars] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reloadRatings, setReloadRatings] = useState(false);
  const navigate = useNavigate();
  const handleSubmitReview = async () => {
    if (!reviewText.trim()) {
      alert('Vui lòng nhập nội dung đánh giá');
      return;
    }

    try {
      setIsSubmitting(true);

      const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
          alert('Bạn cần đăng nhập để đánh giá');
          return;
        }

      const ratingData = {
        // movie_id: id,
        user_id: user.id,
        name: user.full_name,
        star_number: reviewStars,
        comment: reviewText,
      };

      console.log('user_id:', user?.id);
      console.log('name:', user?.name);
      console.log('star_number:', reviewStars, '=>', typeof reviewStars);
      console.log('comment:', reviewText);


      console.log('ratingData:', ratingData);
      const res = await postRating(id, ratingData);
      console.log('Đánh giá gửi thành công:', res);

      alert('Gửi đánh giá thành công!');

      // Reset form
      setShowReviewForm(false);
      setReviewText('');
      setReviewStars(5);
      setReloadRatings(prev => !prev); // Toggle để trigger reload

      // Optional: Có thể refetch lại list rating nếu bạn muốn update ngay
      // await fetchRatings();

    } catch (err) {
      console.error('Gửi đánh giá thất bại:', err);
      alert('Có lỗi khi gửi đánh giá');
    } finally {
      setIsSubmitting(false);
    }
  };
  useEffect(() => {
    const fetchUserProfile = async () => {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        try {
          const profile = await getUserProfile();
          localStorage.setItem('user', JSON.stringify(profile));
          console.log('Fetched user profile:', profile);
        } catch (err) {
          console.error('Failed to fetch user profile:', err);
        }
      }
    };

    fetchUserProfile();
  }, []);
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Lấy thông tin chi tiết phim
        const movieData = await getMovieDetails(id);
        console.log(`Movie data for ID ${id}:`, movieData);
        setMovie(movieData);

        // Tăng lượt xem phim
        //await incrementMovieView(id);

        // Lấy danh sách phim liên quan
        // try {
        //   const relatedMovies = await fetchRelatedMovies(id, 6);
        //   setRelatedMoviesData(relatedMovies || []);
        // } catch (relatedError) {
        //   console.warn('Could not fetch related movies:', relatedError);
        //   setRelatedMoviesData([]);
        // }
        
      } catch (err) {
        setError('Không thể tải thông tin phim');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);
 
const handleWatchMovie = () => {
  console.log(`Watching movie ${movie?.id}`);
  navigate(`/watch/${movie?.id}`);
};

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const formatRuntime = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="movie-detail-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Đang tải thông tin phim...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="movie-detail-page">
        <div className="error-container">
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  // No movie data
  if (!movie) {
    return (
      <div className="movie-detail-page">
        <div className="no-data-container">
          <p>Không tìm thấy thông tin phim</p>
        </div>
      </div>
    );
  }
  const getImageUrl = (path) => {
    if (!path) return '/placeholder.jpg';
    if (path.startsWith('https')) return path;
    return baseImageUrl + path;
  };
  return (
    <div className="movie-detail-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div
          className="backdrop-image"
          style={{ 
            backgroundImage: getImageUrl(movie?.backdrop_path)
              ? `url(${getImageUrl(movie.backdrop_path)})` 
              : 'none'
          }}
        >
          <div className="backdrop-overlay"></div>
        </div>

        <div className="movie-info-overlay">
          {/* Movie Poster */}
          <div className="movie-poster-container">
            <img 
                src={`${baseImageUrl}${movie.poster_path}`}
                
                alt={movie?.title}
                className="movie-poster"
                onError={(e) => {
                  e.target.src = '/placeholder.jpg';
                }}
              />  
              
          </div>

          {/* Movie Info */}
          <div className="movie-info">
            {/* Rating Badge */}
            <div className="rating-badge">
              <Star size={16} className="star-icon" />
              <span className="rating-value">
                {movie?.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}/10
              </span>
            </div>

            {/* Title */}
            <h1 className="movie-title">{movie?.title || 'Untitled'}</h1>
            
            {/* Genres */}
            <div className="genre-container">
              {movie?.genres && Array.isArray(movie.genres) && movie.genres.length > 0 ? (
                movie.genres.map((genre, index) => (
                  <span key={index} className="genre-tag">
                    {genre}
                  </span>
                ))
              ) : (
                <span className="genre-tag">Chưa phân loại</span>
              )}
            </div>

            {/* Description */}
            <p className="movie-description">
              {movie?.overview || movie?.description || 'Chưa có mô tả'}
            </p>

            {/* Stats */}
            <div className="movie-stats">
              <div className="stat-item">
                <Calendar size={18} className="stat-icon" />
                <span>
                  {movie?.release_date 
                    ? formatDate(movie.release_date)
                    : movie?.release_year 
                      ? new Date(movie.release_year).getFullYear()
                      : 'N/A'
                  }
                </span>
              </div>
              <div className="stat-item">
                <Clock size={18} className="stat-icon" />
                <span>{formatRuntime(movie?.runtime || movie?.duration_minutes)}</span>
              </div>
              <div className="stat-item">
                <Eye size={18} className="stat-icon" />
                <span>{(movie?.view_count || 0).toLocaleString()} lượt xem</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button
                onClick={handleWatchMovie}
                className="watch-button"
              >
                <Play size={20} className="button-icon" />
                Xem phim ngay
              </button>
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className={`save-button ${isFavorite ? 'saved' : ''}`}
              >
                <Heart size={20} className="button-icon" fill={isFavorite ? "currentColor" : "none"} />
                {isFavorite ? 'Đã yêu thích' : 'Yêu thích'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Related Movies Section */}
      {relatedMoviesData && relatedMoviesData.length > 0 && (
        <div className="content-section">
          <div className="section-container">
            <div className="section-header">
              <h2 className="section-title">Phim tương tự</h2>
              <button className="view-all-button">
                Xem tất cả
                <ArrowRight size={16} className="arrow-icon" />
              </button>
            </div>

            <div className="movie-grid">
              {relatedMoviesData.map((relatedMovie) => (
                <div key={relatedMovie.id} className="movie-card">
                  <div className="poster-container">
                    <img
                      src={`${baseImageUrl}${relatedMovie.poster_path}`}
                      alt={relatedMovie.title}
                      className="movie-poster"
                      onError={(e) => {
                        e.target.src = '/placeholder.jpg';
                      }}
                    />
                    <div className="poster-overlay">
                      <button className="play-button">
                        <Play size={20} fill="currentColor" />
                      </button>
                    </div>
                  </div>
                  <h3 className="movie-card-title">{relatedMovie?.title}</h3>
                  <p className="movie-year">
                    {relatedMovie?.release_date 
                      ? new Date(relatedMovie.release_date).getFullYear()
                      : relatedMovie?.release_year 
                        ? new Date(relatedMovie.release_year).getFullYear()
                        : 'N/A'
                    }
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cast Section */}
      <div className="content-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Diễn viên và Đạo diễn</h2>
          </div>
          <MovieCharacters movieId={id} />
        </div>
      </div>
          {/* Reviews Section */}
      <div className="content-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">
              <Award size={28} />
              Đánh giá từ người xem
            </h2>
            {/* <button className="write-review-button">
              Viết đánh giá
              <ArrowRight size={16} className="arrow-icon" />
            </button> */}

            <button
              className="write-review-button"
              onClick={() => setShowReviewForm(!showReviewForm)}
            >
              {showReviewForm ? 'Ẩn form' : 'Viết đánh giá'}
              <ArrowRight size={16} className="arrow-icon" />
            </button>

          </div>

          {showReviewForm && (
            <div className="review-form">
              <textarea
                placeholder="Nhập đánh giá của bạn..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={4}
              ></textarea>

              <div className="star-rating-input">
                <label>Đánh giá: </label>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={28}
                    className={`star-icon ${star <= reviewStars ? 'filled' : ''}`}
                    onClick={() => setReviewStars(star)}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </div>

              <button
                className="submit-review-button"
                onClick={handleSubmitReview}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
            </div>
          )}
          
          <MovieRatings movieId={id} reload={reloadRatings}/>
        </div>
      </div>
    </div>
    // </div>
  );
};

export default MovieDetail;