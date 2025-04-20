/**
 * Home Page Component
 * 
 * Trang chủ của ứng dụng Netflix clone, hiển thị:
 * - Banner phim nổi bật
 * - Danh sách phim ngẫu nhiên
 * - Danh sách phim được xem nhiều nhất
 * - Các danh sách phim theo thể loại
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRandomMovies, getMostViewedMovies } from '../api/movieApi';
import MovieRow from '../components/MovieRow';
import FeaturedBanner from '../components/FeaturedBanner';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/Home.css';

function Home() {
  const [randomMovies, setRandomMovies] = useState([]);
  const [mostViewedMovies, setMostViewedMovies] = useState([]);
  const [featuredMovie, setFeaturedMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Hàm để tải dữ liệu từ API
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Lấy danh sách phim ngẫu nhiên
        const randomMoviesData = await getRandomMovies(10);
        setRandomMovies(randomMoviesData);
        
        // Lấy danh sách phim được xem nhiều nhất
        const mostViewedMoviesData = await getMostViewedMovies(10);
        setMostViewedMovies(mostViewedMoviesData);
        
        // Chọn một phim để hiển thị banner
        if (randomMoviesData.length > 0) {
          setFeaturedMovie(randomMoviesData[0]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching movies:', err);
        setError('Không thể tải dữ liệu phim. Vui lòng thử lại sau.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Hàm xử lý khi nhấp vào phim để chuyển đến trang chi tiết
  const handleMovieClick = (movieId) => {
    navigate(`/movies/${movieId}`);
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button className="retry-button" onClick={() => window.location.reload()}>
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Banner phim nổi bật */}
      {featuredMovie && <FeaturedBanner movie={featuredMovie} onWatch={() => handleMovieClick(featuredMovie.id)} />}

      <div className="movie-rows-container">
        {/* Danh sách phim ngẫu nhiên */}
        <MovieRow
          title="Phim đề xuất cho bạn"
          movies={randomMovies}
          onMovieClick={handleMovieClick}
        />

        {/* Danh sách phim được xem nhiều nhất */}
        <MovieRow
          title="Phim được xem nhiều nhất"
          movies={mostViewedMovies}
          onMovieClick={handleMovieClick}
        />
        
        {/* Thêm các danh sách phim theo thể loại khác ở đây */}
      </div>
    </div>
  );
}

export default Home; 