import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../styles/MoviePlayer.css";

export default function MoviePlayer() {
  const { id: movieId } = useParams();
  const [fileId, setFileId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [movieTitle, setMovieTitle] = useState("Phim Hay");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(7200); // 2 hours in seconds
  const [volume, setVolume] = useState(80);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [subtitle, setSubtitle] = useState(true);
  const [quality, setQuality] = useState("1080p");
  
  // Comments and interactions
  const [comments, setComments] = useState([]);
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/v1/movies/${movieId}/comment`);
        // Giả sử API trả về dữ liệu bình luận trong res.data
        const commentsData = res.data; // Cập nhật theo cấu trúc dữ liệu từ API
        setComments(commentsData);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu bình luận:", error);
      }
    };

    fetchComments();
  }, [movieId]);

  const [newComment, setNewComment] = useState("");
  const [viewerCount, setViewerCount] = useState(1247);
  
  // Related/Recommended movies
  const [relatedMovies, setRelatedMovies] = useState([
    {
      id: 1,
      title: "Phim Hành Động Mới",
      thumbnail: "/api/placeholder/160/90",
      duration: "1h 58m",
      views: "2.1M"
    },
    {
      id: 2,
      title: "Bom Tấn Khoa Học Viễn Tưởng",
      thumbnail: "/api/placeholder/160/90",
      duration: "2h 15m",
      views: "1.8M"
    },
    {
      id: 3,
      title: "Phim Kinh Dị Hay Nhất",
      thumbnail: "/api/placeholder/160/90",
      duration: "1h 42m",
      views: "956K"
    },
    {
      id: 4,
      title: "Tình Cảm Lãng Mạn",
      thumbnail: "/api/placeholder/160/90",
      duration: "1h 35m",
      views: "3.2M"
    }
  ]);

  const controlsTimeoutRef = useRef(null);

  useEffect(() => {
    const fetchDriveFileId = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8000/api/v1/movies/${movieId}/drive-url`
        );
        setFileId(res.data.drive_url);
        setLoading(false);
      } catch (err) {
        console.error("Lỗi khi lấy file ID Google Drive:", err);
        setError("Không tìm được video.");
        setLoading(false);
      }
    };

    fetchDriveFileId();
  }, [movieId]);

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

  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment = {
        id: comments.length + 1,
        user: "Bạn",
        avatar: "U",
        time: "Vừa xong",
        content: newComment,
        likes: 0,
        timestamp: formatTime(currentTime)
      };
      setComments([comment, ...comments]);
      setNewComment("");
    }
  };

  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <div className="error-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          </div>
          <h3 className="error-title">Không thể phát video</h3>
          <p className="error-message">{error}</p>
          <button className="retry-btn">Thử lại</button>
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
              <div className="progress-fill" style={{width: "65%"}}></div>
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
          <button className="back-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
            <span>Quay lại</span>
          </button>
          
          <div className="header-info">
            <h2 className="header-title">{movieTitle}</h2>
            <div className="live-info">
              <span className="live-dot"></span>
              <span>{viewerCount.toLocaleString()} đang xem</span>
            </div>
          </div>

          <div className="header-controls">
            <button className="header-btn" title="Tải xuống">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
              </svg>
            </button>
            <button className="header-btn" title="Cài đặt">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
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
                {/* <div className="video-controls">
                  <div className="progress-container">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{width: `${(currentTime / duration) * 100}%`}}
                      ></div>
                      <button 
                        className="progress-thumb"
                        style={{left: `${(currentTime / duration) * 100}%`}}
                      ></button>
                    </div>
                  </div>
                  
                  <div className="controls-row">
                    <div className="controls-left">
                      <button 
                        className="play-btn"
                        onClick={() => setIsPlaying(!isPlaying)}
                      >
                        {isPlaying ? (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                          </svg>
                        ) : (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        )}
                      </button>
                      
                      <div className="volume-control">
                        <button className="volume-btn">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                          </svg>
                        </button>
                        <div className="volume-slider">
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={volume}
                            onChange={(e) => setVolume(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <span className="time-display">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>
                    
                    <div className="controls-right">
                      <div className="settings-dropdown">
                        <button className="settings-btn">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                          </svg>
                        </button>
                        <div className="settings-menu">
                          <div className="setting-item">
                            <span>Tốc độ phát</span>
                            <select value={playbackSpeed} onChange={(e) => setPlaybackSpeed(e.target.value)}>
                              <option value="0.5">0.5x</option>
                              <option value="0.75">0.75x</option>
                              <option value="1">1x</option>
                              <option value="1.25">1.25x</option>
                              <option value="1.5">1.5x</option>
                              <option value="2">2x</option>
                            </select>
                          </div>
                          <div className="setting-item">
                            <span>Chất lượng</span>
                            <select value={quality} onChange={(e) => setQuality(e.target.value)}>
                              <option value="360p">360p</option>
                              <option value="480p">480p</option>
                              <option value="720p">720p</option>
                              <option value="1080p">1080p</option>
                              <option value="1440p">1440p</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        className={`subtitle-btn ${subtitle ? 'active' : ''}`}
                        onClick={() => setSubtitle(!subtitle)}
                        title="Phụ đề"
                      >
                        CC
                      </button>
                      
                      <button 
                        className="fullscreen-btn"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div> */}
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
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
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
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Related Videos */}
          <div className="related-section">
            <h3>Video liên quan</h3>
            <div className="related-videos">
              {relatedMovies.map((movie) => (
                <div key={movie.id} className="related-video">
                  <div className="related-thumbnail">
                    <img src={movie.thumbnail} alt={movie.title} />
                    <span className="video-duration">{movie.duration}</span>
                  </div>
                  <div className="related-info">
                    <h4 className="related-title">{movie.title}</h4>
                    <p className="related-views">{movie.views} lượt xem</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}