/**
 * MovieRow Component
 * 
 * Hiển thị một hàng phim theo chiều ngang với khả năng cuộn ngang.
 * Mỗi phim được hiển thị thông qua component MovieItem.
 * 
 * Tính năng:
 * - Cuộn phim sang trái/phải
 * - Trạng thái hiển thị nút cuộn khi hover
 * - Responsive design với số lượng phim hiển thị tùy theo kích thước màn hình
 */

import { useState, useRef } from 'react';
import MovieItem from './MovieItem';
import '../styles/MovieRow.css';

function MovieRow({ title, movies, onMovieClick }) {
  const [isScrolling, setIsScrolling] = useState(false);
  const rowRef = useRef(null);

  // Hàm xử lý cuộn sang trái
  const handleScrollLeft = () => {
    if (rowRef.current) {
      const scrollAmount = rowRef.current.clientWidth * 0.7;
      rowRef.current.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Hàm xử lý cuộn sang phải
  const handleScrollRight = () => {
    if (rowRef.current) {
      const scrollAmount = rowRef.current.clientWidth * 0.7;
      rowRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Xử lý hiển thị các nút cuộn khi di chuột vào hàng phim
  const handleMouseEnter = () => {
    setIsScrolling(true);
  };

  // Ẩn các nút cuộn khi di chuột ra khỏi hàng phim
  const handleMouseLeave = () => {
    setIsScrolling(false);
  };

  // Kiểm tra nếu không có phim nào
  if (!movies || movies.length === 0) {
    return null;
  }

  return (
    <div 
      className="movie-row"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <h2 className="row-title">{title}</h2>
      
      <div className="row-container">
        {/* Nút cuộn trái */}
        {isScrolling && (
          <button className="scroll-button left" onClick={handleScrollLeft}>
            <i className="scroll-icon left-icon">&#10094;</i>
          </button>
        )}
        
        {/* Danh sách phim */}
        <div className="movies-container" ref={rowRef}>
          {movies.map((movie) => (
            <MovieItem 
              key={movie.id}
              movie={movie}
              onMovieClick={onMovieClick}
              displayMode="row"
            />
          ))}
        </div>
        
        {/* Nút cuộn phải */}
        {isScrolling && (
          <button className="scroll-button right" onClick={handleScrollRight}>
            <i className="scroll-icon right-icon">&#10095;</i>
          </button>
        )}
      </div>
    </div>
  );
}

export default MovieRow; 