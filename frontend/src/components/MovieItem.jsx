/**
 * MovieItem Component
 *
 * Shared component used for displaying individual movie items across the application.
 * Used by both MovieRow (horizontal scrolling) and MovieList (vertical layout).
 *
 * Features:
 * - Displays movie poster with hover effects
 * - Shows title and watch button on hover
 * - Handles click events for navigation
 * - Supports different display modes (row vs list)
 */

import { useState } from 'react';
import '../styles/MovieItem.css';


function MovieItem({
  movie,
  onMovieClick,
  displayMode = 'row', // 'row' for horizontal layout, 'list' for vertical layout
  showDetails = false   // Whether to always show movie details (for list view)
}) {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Handle poster click
  const handlePosterClick = () => {
    if (onMovieClick) {
      onMovieClick(movie.id);
    }
  };
  const BASE_IMAGE_URL = 'https://image.tmdb.org/t/p/w500';
  // Handle watch button click
  const handleWatchClick = (e) => {
    e.stopPropagation(); // Prevent triggering the poster click
    if (onMovieClick) {
      onMovieClick(movie.id);
    }
  };

  // Generate a CSS class based on the display mode
  const itemClass = `movie-item ${displayMode === 'list' ? 'list-mode' : 'row-mode'}`;

  return (
    <div className={itemClass}>
      <div className="movie-poster-container">
        {!imageLoaded && <div className="movie-poster-placeholder"></div>}
        <img
          src={`${BASE_IMAGE_URL}${movie.poster_path}`}
          alt={movie.title}
          className={`movie-poster ${imageLoaded ? 'loaded' : ''}`}
          onClick={handlePosterClick}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageLoaded(true)} // Handle image load error
        />

        {/* Overlay shown on hover or always in list mode if showDetails is true */}
        <div className={`movie-overlay ${showDetails ? 'always-show' : ''}`}>
          <h5 className="movie-title">{movie.title}</h5>

          {/* Additional details in list mode */}
          {displayMode === 'list' && showDetails && (
            <div className="movie-details">
              <div className="movie-year">{movie.release_year}</div>
              <div className="movie-duration">{movie.duration_minutes} phút</div>
              {movie.rating && <div className="movie-rating">⭐ {movie.rating}/10</div>}
            </div>
          )}

          <button
            className="watch-button"
            onClick={handleWatchClick}
          >
            Xem phim
          </button>
        </div>
      </div>
    </div>
  );
}

export default MovieItem;