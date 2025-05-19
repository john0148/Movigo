import { useState } from 'react';
import { Heart, Calendar, Clock, Eye, Play, Plus, Star, ArrowRight } from 'lucide-react';
import '../styles/MovieDetail.css';
import { getMovieDetails, fetchRelatedMovies, incrementMovieView } from '../api/movieApi';
const MovieDetail = () => {
  const [movie, setMovie] = useState(null);

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
        const relatedMoviesData = await fetchRelatedMovies(id, 6);
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
  // Mock data cho chi tiết phim
  // const movieData = {
  //   id: "1",
  //   title: "Avengers: Endgame",
  //   description: "Sau các sự kiện tàn khốc của Avengers: Infinity War, vũ trụ đang trong cảnh hoang tàn. Với sự giúp đỡ của các đồng minh còn lại, các Avengers tập hợp một lần nữa để đảo ngược hành động của Thanos và khôi phục sự cân bằng cho vũ trụ.",
  //   genres: ["Hành động", "Viễn tưởng", "Phiêu lưu"],
  //   release_year: "2019-04-26",
  //   duration_minutes: 181,
  //   rating: 8.4,
  //   view_count: 12543789,
  //   poster_url: "https://m.media-amazon.com/images/M/MV5BMTc5MDE2ODcwNV5BMl5BanBnXkFtZTgwMzI2NzQ2NzM@._V1_.jpg",
  //   backdrop_url: "https://wallpaperaccess.com/full/1079195.jpg",
  // };

  // // Mock data cho phim liên quan
  // const relatedMoviesData = [
  //   {
  //     id: "2",
  //     title: "Avengers: Infinity War",
  //     release_year: "2018-04-27",
  //     poster_url: "https://m.media-amazon.com/images/M/MV5BMjMxNjY2MDU1OV5BMl5BanBnXkFtZTgwNzY1MTUwNTM@._V1_.jpg"
  //   },
  //   {
  //     id: "3",
  //     title: "Black Panther",
  //     release_year: "2018-02-16",
  //     poster_url: "https://m.media-amazon.com/images/M/MV5BMTg1MTY2MjYzNV5BMl5BanBnXkFtZTgwMTc4NTMwNDI@._V1_.jpg"
  //   },
  //   {
  //     id: "4",
  //     title: "Captain Marvel",
  //     release_year: "2019-03-08",
  //     poster_url: "https://m.media-amazon.com/images/M/MV5BMTE0YWFmOTMtYTU2ZS00ZTIxLWE3OTEtYTNiYzBkZjViZThiXkEyXkFqcGdeQXVyODMzMzQ4OTI@._V1_.jpg"
  //   },
  //   {
  //     id: "5",
  //     title: "Spider-Man: Far From Home",
  //     release_year: "2019-07-02",
  //     poster_url: "https://m.media-amazon.com/images/M/MV5BMGZlNTY1ZWUtYTMzNC00ZjUyLWE0MjQtMTMxN2E3ODYxMWVmXkEyXkFqcGdeQXVyMDM2NDM2MQ@@._V1_.jpg"
  //   },
  //   {
  //     id: "6",
  //     title: "Doctor Strange",
  //     release_year: "2016-11-04",
  //     poster_url: "https://m.media-amazon.com/images/M/MV5BNjgwNzAzNjk1Nl5BMl5BanBnXkFtZTgwMzQ2NjI1OTE@._V1_.jpg"
  //   },
  //   {
  //     id: "7",
  //     title: "Thor: Ragnarok",
  //     release_year: "2017-11-03",
  //     poster_url: "https://m.media-amazon.com/images/M/MV5BMjMyNDkzMzI1OF5BMl5BanBnXkFtZTgwODcxODg5MjI@._V1_.jpg"
  //   }
  // ];

  const handleWatchMovie = () => {
    console.log(`Watching movie ${movieData.id}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const formatRuntime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
  };

  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <div className="movie-detail-page">

      <div className="hero-section">

        <div
          className="backdrop-image"
          style={{ backgroundImage: `url(${movieData.backdrop_url})` }}
        >
          <div className="backdrop-overlay"></div>
        </div>


        <div className="movie-info-overlay">

          <div className="rating-badge">
            <Star size={16} className="star-icon" />
            <span className="rating-value">{movieData.rating}/10</span>
          </div>


          <h1 className="movie-title">{movieData.title}</h1>
          <div className="genre-container">
            {movieData.genres.map((genre, index) => (
              <span key={index} className="genre-tag">
                {genre}
              </span>
            ))}
          </div>

          {/* Description */}
          <p className="movie-description">{movieData.description}</p>

          {/* Movie stats */}
          <div className="movie-stats">
            <div className="stat-item">
              <Calendar size={18} className="stat-icon" />
              <span>{formatDate(movieData.release_year)}</span>
            </div>
            <div className="stat-item">
              <Clock size={18} className="stat-icon" />
              <span>{formatRuntime(movieData.duration_minutes)}</span>
            </div>
            <div className="stat-item">
              <Eye size={18} className="stat-icon" />
              <span>{movieData.view_count.toLocaleString()} lượt xem</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="action-buttons">
            <button
              onClick={handleWatchMovie}
              className="watch-button"
            >
              <Play size={20} className="button-icon" />
              Xem phim
            </button>
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={`save-button ${isFavorite ? 'saved' : ''}`}
            >
              <Heart size={20} className="button-icon" fill={isFavorite ? "currentColor" : "none"} />
              {isFavorite ? 'Đã lưu' : 'Lưu phim'}
            </button>
          </div>
        </div>
      </div>


      <div className="similar-movies-section">
        <div className="section-header">
          <h2 className="section-title">Phim tương tự</h2>
          <button className="view-all-button">
            Xem tất cả
            <ArrowRight size={16} className="arrow-icon" />
          </button>
        </div>


        <div className="movie-grid">
          {relatedMoviesData.map((movie) => (
            <div key={movie.id} className="movie-card">
              <div className="poster-container">
                <img
                  src={movie.poster_url}
                  alt={movie.title}
                  className="movie-poster"
                />
                <div className="poster-overlay">
                  <button className="play-button">
                    <Play size={20} fill="currentColor" />
                  </button>
                </div>
              </div>
              <h3 className="movie-card-title">{movie.title}</h3>
              <p className="movie-year">{new Date(movie.release_year).getFullYear()}</p>
            </div>
          ))}
        </div>
      </div>


      <div className="cast-section">
        <h2 className="section-title">Diễn viên chính</h2>
        <div className="cast-container">
          {/* This would be filled with actual cast data */}
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="cast-card">
              <div className="cast-photo"></div>
              <h3 className="cast-name">Diễn viên {i}</h3>
              <p className="cast-role">Vai diễn {i}</p>
            </div>
          ))}
        </div>
      </div>


      <div className="reviews-section">
        <div className="section-header">
          <h2 className="section-title">Đánh giá từ người xem</h2>
          <button className="write-review-button">
            Viết đánh giá
            <ArrowRight size={16} className="arrow-icon" />
          </button>
        </div>

        <div className="reviews-container">
          {[1, 2].map(i => (
            <div key={i} className="review-card">
              <div className="review-header">
                <div className="reviewer-avatar"></div>
                <div className="reviewer-info">
                  <h3 className="reviewer-name">Người dùng {i}</h3>
                  <div className="rating-stars">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} size={16} fill="currentColor" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="review-text">Đây là một bộ phim tuyệt vời! Cốt truyện hấp dẫn và diễn xuất của các diễn viên rất ấn tượng. Tôi sẽ xem lại phim này trong tương lai.</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;