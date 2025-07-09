import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_IMAGE_URL } from '../config/constants';
import { searchMovies } from "../api/movieApi"; // Import searchMovies function
import "../styles/MoviePlayer.css";

export default function MoviePlayer() {
  const { id: movieId } = useParams();

  const navigate = useNavigate();
  const [fileId, setFileId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [movieTitle, setMovieTitle] = useState("Phim Hay");
  const [movieInfo, setMovieInfo] = useState(null);
  const [movieGenres, setMovieGenres] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(7200);
  const [volume, setVolume] = useState(80);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [subtitle, setSubtitle] = useState(true);
  const [quality, setQuality] = useState("1080p");

  // Comments and interactions
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [viewerCount, setViewerCount] = useState(1247);

  // Related/Recommended movies
  const [relatedMovies, setRelatedMovies] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  const controlsTimeoutRef = useRef(null);

  // Lấy thông tin phim và file ID
  useEffect(() => {
    const fetchMovieData = async () => {
      try {
        setLoading(true);

        // Lấy thông tin phim
        const movieResponse = await axios.get(`http://localhost:8000/api/v1/movies/${movieId}`);
        const movie = movieResponse.data;
        console.log("Movie data:", movie);
        setMovieInfo(movie);
        setMovieTitle(movie.title || movie.name || "Phim Hay");
        setMovieGenres(movie.genre || movie.genres || []);
        console.log("Movie genres:", movieGenres);
        // Lấy drive URL
        const driveResponse = await axios.get(`http://localhost:8000/api/v1/movies/${movieId}/drive-url`);
        setFileId(driveResponse.data.drive_url);

        setLoading(false);
      } catch (err) {
        console.error("Lỗi khi lấy thông tin phim:", err);
        setError("Không tìm được video.");
        setLoading(false);
      }
    };


    if (movieId) {
      fetchMovieData();
    }
  }, [movieId]);

  // Lấy bình luận
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/v1/movies/${movieId}/comment`);
        const commentsData = res.data;
        setComments(commentsData);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu bình luận:", error);
      }
    };

    if (movieId) {
      fetchComments();
    }
  }, [movieId]);
  console.log("hello");
  // Lấy phim liên quan theo thể loại
  useEffect(() => {
    const fetchRelatedMovies = async () => {
      if (!movieGenres) return;

      try {
        setLoadingRelated(true);

        // Lấy thể loại đầu tiên nếu có nhiều thể loại
        let primaryGenre = movieGenres;
        if (Array.isArray(movieGenres)) {
          primaryGenre = movieGenres[0];
        }

        // Sử dụng searchMovies để tìm phim cùng thể loại
        const relatedData = await searchMovies("", primaryGenre, null, 1, 12);
        console.log("Related movies data:", relatedData);
        let relatedResults = [];
        if (relatedData && relatedData.results) {
          relatedResults = relatedData.results;
        } else if (Array.isArray(relatedData)) {
          relatedResults = relatedData;
        }

        // Lọc bỏ phim hiện tại khỏi danh sách liên quan
        const filteredResults = relatedResults.filter(movie =>
          (movie.id || movie._id) !== movieId
        );

        // Chuyển đổi dữ liệu để phù hợp với component
        const formattedRelated = filteredResults.slice(0, 8).map(movie => ({
          id: movie.id || movie._id,
          title: movie.title || movie.name,
          thumbnail: movie.poster_url || movie.thumbnail || "/api/placeholder/160/90",
          duration: formatDuration(movie.duration) || "N/A",
          views: formatViews(movie.views) || "N/A",
          genre: movie.genre || movie.genres,
          year: movie.year || movie.release_year
        }));

        setRelatedMovies(formattedRelated);
        setLoadingRelated(false);
      } catch (error) {
        console.error("Lỗi khi lấy phim liên quan:", error);
        setLoadingRelated(false);

        // Fallback: lấy phim phổ biến nếu không tìm được theo thể loại
        try {
          const popularData = await searchMovies("", "popular", null, 1, 8);
          let popularResults = [];

          if (popularData && popularData.results) {
            popularResults = popularData.results;
          } else if (Array.isArray(popularData)) {
            popularResults = popularData;
          }

          const filteredPopular = popularResults.filter(movie =>
            (movie.id || movie._id) !== movieId
          );

          const formattedPopular = filteredPopular.slice(0, 8).map(movie => ({
            id: movie.id || movie._id,
            title: movie.title || movie.name,
            thumbnail: movie.poster_url || movie.thumbnail || "/api/placeholder/160/90",
            duration: formatDuration(movie.duration) || "N/A",
            views: formatViews(movie.views) || "N/A",
            genre: movie.genre || movie.genres,
            year: movie.year || movie.release_year
          }));

          setRelatedMovies(formattedPopular);
        } catch (fallbackError) {
          console.error("Lỗi khi lấy phim phổ biến:", fallbackError);
        }
      }
    };

    // Chỉ fetch khi đã có thông tin phim
    if (movieInfo) {
      fetchRelatedMovies();
    }
  }, [movieInfo, movieId]);

  // Helper functions
  const formatDuration = (duration) => {
    if (!duration) return null;

    if (typeof duration === 'string') {
      return duration;
    }

    if (typeof duration === 'number') {
      const hours = Math.floor(duration / 3600);
      const minutes = Math.floor((duration % 3600) / 60);

      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    }

    return null;
  };

  const formatViews = (views) => {
    if (!views) return null;

    if (typeof views === 'string') {
      return views;
    }

    if (typeof views === 'number') {
      if (views >= 1000000) {
        return `${(views / 1000000).toFixed(1)}M`;
      } else if (views >= 1000) {
        return `${(views / 1000).toFixed(1)}K`;
      }
      return views.toString();
    }

    return null;
  };

  // Format time helper
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle mouse movement for controls
  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const commentData = {
      user: "Bạn",
      avatar: "U",
      time: "Vừa xong",
      content: newComment,
      likes: 0,
      timestamp: formatTime(currentTime),
      movie_id: movieId  // <-- nhớ truyền đúng ID
    };

    try {
      const response = await fetch(`http://localhost:8000/api/v1/movies/${movieId}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(commentData)
      });

      if (!response.ok) throw new Error("Gửi bình luận thất bại");

      const newPostedComment = await response.json();
      setComments(prev => [newPostedComment, ...prev]);
      setNewComment("");

    } catch (error) {
      console.error("Lỗi gửi bình luận:", error);
      alert("Không thể gửi bình luận.");
    }
  };


  // Handle related movie click
  const handleRelatedMovieClick = (movieId) => {
    navigate(`/movies/${movieId}`);
  };

  // Handle back button
  const handleBackClick = () => {
    navigate(-1);
  };

  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <div className="error-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
          </div>
          <h3 className="error-title">Không thể phát video</h3>
          <p className="error-message">{error}</p>
          <button className="retry-btn" onClick={() => window.location.reload()}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-active"></div>
          </div>
          <h3 className="loading-title">Đang tải video...</h3>
          <p className="loading-message">Vui lòng chờ trong giây lát</p>
          <div className="loading-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: "65%" }}></div>
            </div>
            <span className="progress-text">65%</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="movie-player" onMouseMove={handleMouseMove}>
      {/* Header */}
      <div className="movie-header">
        <div className="header-content">
          <button className="back-button" onClick={handleBackClick}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
            <span>Quay lại</span>
          </button>

          <div className="header-info">
            <h2 className="header-title">{movieTitle}</h2>
            <div className="live-info">
              <span className="live-dot"></span>
              <span>{viewerCount.toLocaleString()} đang xem</span>
            </div>
            {movieInfo && (
              <div className="movie-meta">
                {movieInfo.year && <span className="movie-year">{movieInfo.year}</span>}
                {movieInfo.genre && (
                  <span className="movie-genre">
                    {Array.isArray(movieInfo.genre) ? movieInfo.genre.join(', ') : movieInfo.genre}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="header-controls">
            <button className="header-btn" title="Tải xuống">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
              </svg>
            </button>
            <button className="header-btn" title="Cài đặt">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="main-content">
        {/* Video Player */}
        <div className="video-section">
          <div className="video-wrapper">
            <div className="video-container">
              <iframe
                src={`https://drive.google.com/file/d/${fileId}/preview`}
                className="video-iframe"
                allow="autoplay"
                allowFullScreen
              />

              {/* Video Controls Overlay */}
              <div className={`video-overlay ${showControls ? 'show' : ''}`}>

              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="sidebar">
          {/* Live Chat */}
          <div className="chat-section">
            <div className="chat-header">
              <h3>Bình luận trực tiếp</h3>
              <div className="chat-stats">
                <span>{comments.length} bình luận</span>
              </div>
            </div>

            <div className="chat-messages">
              {comments.map((comment) => (
                <div key={comment.id} className="chat-message">
                  <div className="message-avatar">{comment.avatar}</div>
                  <div className="message-content">
                    <div className="message-header">
                      <span className="message-user">{comment.user}</span>
                      <span className="message-time">{comment.time}</span>
                      <span className="message-timestamp">{comment.timestamp}</span>
                    </div>
                    <p className="message-text">{comment.content}</p>
                    <div className="message-actions">
                      <button className="like-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                        <span>{comment.likes}</span>
                      </button>
                      <button className="reply-btn">Trả lời</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="chat-input">
              <input
                type="text"
                placeholder="Viết bình luận..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <button onClick={handleAddComment} className="send-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Related Videos */}
          <div className="related-section">
            <div className="related-header">
              <h3>
                Video liên quan
                {movieInfo && movieInfo.genre && (
                  <span className="related-genre-tag">
                    {Array.isArray(movieInfo.genre) ? movieInfo.genre[0] : movieInfo.genre}
                  </span>
                )}
              </h3>
              {loadingRelated && <div className="loading-spinner-small"></div>}
            </div>

            <div className="related-videos">
              {relatedMovies.map((movie) => (
                <div
                  key={movie.id}
                  className="related-video"
                  onClick={() => handleRelatedMovieClick(movie.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="related-thumbnail">
                    <img
                      src={`  ${BASE_IMAGE_URL}${movie.poster_path}`} />
                    <span className="video-duration">{movie.duration}</span>
                  </div>
                  <div className="related-info">
                    <h4 className="related-title">{movie.title}</h4>
                    <p className="related-views">{movie.views} lượt xem</p>
                    {movie.genre && (
                      <p className="related-genre">
                        {Array.isArray(movie.genre) ? movie.genre.join(', ') : movie.genre}
                      </p>
                    )}
                    {movie.year && (
                      <p className="related-year">{movie.year}</p>
                    )}
                  </div>
                </div>
              ))}

              {relatedMovies.length === 0 && !loadingRelated && (
                <div className="no-related">
                  <p>Không có video liên quan</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}