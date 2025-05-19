import { useState, useEffect } from 'react';
import '../styles/FeaturedBanner.css';

function FeaturedBanner({ movie, onWatch }) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Reset loading state when movie changes
    setIsLoaded(false);
  }, [movie]);

  // Tạo mô tả ngắn gọn nếu quá dài
  const truncateDescription = (description, maxLength = 200) => {
    if (!description) return '';
    if (description.length <= maxLength) return description;

    // Cắt ở vị trí khoảng trắng gần nhất trước maxLength để không cắt giữa từ
    return description.substr(0, description.lastIndexOf(' ', maxLength)) + '...';
  };

  // Xử lý khi nhấn nút "Thông tin thêm" (mở trang chi tiết phim)
  const handleMoreInfo = () => {
    if (onWatch) {
      onWatch();
    }
  };

  if (!movie) return null;
  const baseImageUrl = 'https://image.tmdb.org/t/p/original';

  // Sử dụng ảnh backdrop nếu có, ngược lại dùng poster
  const imagePath = movie.backdrop_path || movie.poster_path;
  const backgroundImage = imagePath ? `${baseImageUrl}${imagePath}` : '';
  // Lấy năm từ release_date hoặc sử dụng trường release_year nếu có
  const releaseYear = movie.release_date ?
    new Date(movie.release_date).getFullYear() :
    (movie.release_year || '');

  // Lấy thời lượng từ runtime hoặc duration_minutes
  const duration = movie.runtime || movie.duration_minutes || 0;

  // Lấy điểm đánh giá từ vote_average hoặc rating
  const rating = movie.vote_average || movie.rating || 0;

  return (
    <div className="featured-banner">
      {/* Lớp nền tối đi khi ảnh chưa tải xong */}
      {!isLoaded && <div className="banner-placeholder"></div>}

      {/* Ảnh nền */}
      <div
        className={`banner-background ${isLoaded ? 'loaded' : ''}`}
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <img
          src={backgroundImage}
          alt=""
          className="hidden-image"
          onLoad={() => setIsLoaded(true)}
          onError={() => setIsLoaded(true)} // Đánh dấu đã tải trong trường hợp lỗi
        />
      </div>

      {/* Gradient tối dần về phía dưới */}
      <div className="banner-gradient"></div>

      {/* Nội dung banner */}
      <div className="banner-content">
        <h1 className="banner-title">{movie.title}</h1>

        {/* Thông tin bổ sung: Năm, Thời lượng, Rating */}
        <div className="banner-metadata">
          <span className="movie-year">{releaseYear}</span>
          <span className="metadata-separator">•</span>
          <span className="movie-duration">{duration} phút</span>
          {rating > 0 && (
            <>
              <span className="metadata-separator">•</span>
              <span className="movie-rating">⭐ {rating.toFixed(1)}/10</span>
            </>
          )}
        </div>

        <p className="banner-description">
          {truncateDescription(movie.overview)}
        </p>

        <div className="banner-buttons">
          <button className="play-button" onClick={onWatch}>
            <i className="play-icon">▶</i> Xem phim
          </button>
          <button className="info-button" onClick={handleMoreInfo}>
            <i className="info-icon">ℹ</i> Thông tin thêm
          </button>
        </div>
      </div>
    </div>
  );
}

export default FeaturedBanner;