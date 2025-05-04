/**
 * TopMoviesList Component
 * 
 * Hiển thị danh sách phim xem nhiều nhất.
 * Sử dụng lại component MovieList và thêm tính năng lọc theo khoảng thời gian.
 * 
 * Tính năng:
 * - Lọc theo các khoảng thời gian: tuần, tháng, năm
 * - Hiển thị chỉ số xếp hạng
 * - Hiển thị số lượt xem
 */

import { useState, useEffect } from 'react';
import { getMostViewedMovies } from '../../api/movieApi';
import MovieList from './MovieList.jsx';
import LoadingSpinner from '../LoadingSpinner';
import '../../styles/MovieList/TopMoviesList.css';

const TIME_PERIODS = [
  { id: 'week', label: 'Tuần này' },
  { id: 'month', label: 'Tháng này' },
  { id: 'year', label: 'Năm nay' },
  { id: 'all', label: 'Tất cả' }
];

function TopMoviesList({ title = "Phim xem nhiều nhất", limit = 10, onMovieClick }) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timePeriod, setTimePeriod] = useState('week');
  
  useEffect(() => {
    const fetchTopMovies = async () => {
      try {
        setLoading(true);
        const data = await getMostViewedMovies(limit, timePeriod);
        setMovies(data);
      } catch (err) {
        console.error('Error fetching top movies:', err);
        setError('Không thể tải danh sách phim xem nhiều nhất.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTopMovies();
  }, [limit, timePeriod]);
  
  if (loading) {
    return <LoadingSpinner size="small" text="Đang tải phim xem nhiều..." />;
  }
  
  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="top-movies-container">
      <div className="top-movies-header">
        <h2 className="top-movies-title">{title}</h2>
        
        <div className="time-period-filter">
          {TIME_PERIODS.map(period => (
            <button
              key={period.id}
              className={`time-period-button ${timePeriod === period.id ? 'active' : ''}`}
              onClick={() => setTimePeriod(period.id)}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>
      
      <MovieList 
        movies={movies.map((movie, index) => ({
          ...movie,
          rank: index + 1, // Thêm thông tin xếp hạng
        }))}
        onMovieClick={onMovieClick}
        viewMode="list"
        showEmptyMessage={false}
      />
    </div>
  );
}

export default TopMoviesList; 