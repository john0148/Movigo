/**
 * MovieList Component
 * 
 * Hiển thị danh sách phim theo dạng lưới hoặc danh sách dọc.
 * Sử dụng component MovieItem để hiển thị từng phim.
 * 
 * Tính năng:
 * - Hỗ trợ 2 chế độ hiển thị: grid (lưới) và list (danh sách)
 * - Hiển thị tiêu đề cho danh sách
 * - Xử lý trường hợp không có phim nào
 * - Responsive design
 */

import { useState } from 'react';
import MovieItem from '../MovieItem';
import '../../styles/MovieList/MovieList.css';

function MovieList({ 
  title, 
  movies, 
  onMovieClick,
  viewMode = 'grid', // 'grid' or 'list'
  showEmptyMessage = true
}) {
  // State để theo dõi movieItems đã tải
  const [loadedItems, setLoadedItems] = useState(0);
  const totalItems = movies?.length || 0;
  
  // Kiểm tra nếu không có phim nào
  if (!movies || movies.length === 0) {
    if (showEmptyMessage) {
      return (
        <div className="empty-list">
          <h2>{title}</h2>
          <p className="empty-message">Không có phim nào được tìm thấy.</p>
        </div>
      );
    }
    return null;
  }

  // Xử lý khi một MovieItem đã tải xong
  const handleItemLoaded = () => {
    setLoadedItems(prev => prev + 1);
  };
  
  // Tính toán phần trăm đã tải
  const loadedPercentage = Math.floor((loadedItems / totalItems) * 100);
  
  return (
    <div className={`movie-list ${viewMode}-view`}>
      {title && <h2 className="list-title">{title}</h2>}
      
      {/* Hiển thị progress bar khi chưa tải xong */}
      {loadedItems < totalItems && (
        <div className="loading-progress">
          <div 
            className="progress-bar" 
            style={{ width: `${loadedPercentage}%` }}
          ></div>
        </div>
      )}
      
      <div className="movie-list-items">
        {movies.map((movie) => (
          <MovieItem 
            key={movie.id}
            movie={movie}
            onMovieClick={onMovieClick}
            displayMode={viewMode === 'grid' ? 'row' : 'list'}
            showDetails={viewMode === 'list'}
            onImageLoaded={handleItemLoaded}
          />
        ))}
      </div>
    </div>
  );
}

export default MovieList; 