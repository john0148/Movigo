import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/MovieItem.css';

/**
 * MovieItem Component
 * Hiển thị một item phim trong danh sách phim với poster, tên và nút "Xem phim"
 * Props:
 * - movie: Thông tin phim (id, title, poster, description, etc.)
 */
const MovieItem = ({ movie }) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const handleMovieClick = () => {
    navigate(`/movies/${movie.id}`);
  };

  const handleWatchClick = (e) => {
    e.stopPropagation(); // Ngăn không cho click lan tỏa lên parent
    navigate(`/watch/${movie.id}`);
  };

  return (
    <div 
      className={`movie-item ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleMovieClick}
    >
      <img 
        src={movie.poster_url} 
        alt={movie.title} 
        className="movie-poster"
      />
      
      {isHovered && (
        <div className="movie-overlay">
          <h3 className="movie-title">{movie.title}</h3>
          <p className="movie-description">{movie.description.substring(0, 100)}...</p>
          <button 
            className="watch-button"
            onClick={handleWatchClick}
          >
            Xem phim
          </button>
        </div>
      )}
    </div>
  );
};

export default MovieItem; 