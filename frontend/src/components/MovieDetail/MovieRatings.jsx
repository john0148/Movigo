import { useEffect, useState } from "react";
import { getRatingsByMovieId } from "../../api/movieApi";
import { Star } from "lucide-react";
import "../../styles/MovieDetail.css"; 

export function MovieRatings({ movieId }) {
  const [ratings, setRatings] = useState([]);

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const data = await getRatingsByMovieId(movieId);
        console.log("⭐️ API /movies/{movie_id}/ratings trả về:", data);
        setRatings(data);
      } catch (err) {
        console.error("Error fetching ratings:", err);
      }
    };

    fetchRatings();
  }, [movieId]);

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="reviews-container">
      {ratings.length > 0 ? (
        ratings.map((rating) => (
          <div key={rating._id} className="review-card">
            <div className="review-header">
              <div className="reviewer-avatar">{rating.name?.charAt(0)}</div>
              <div className="reviewer-info">
                <h3 className="reviewer-name">{rating.name}</h3>
                <p className="review-date">
                  {rating.created_at ? formatDate(rating.created_at) : ""}
                </p>
                <div className="rating-stars">
                  {[...Array(5)].map((_, j) => (
                    <Star
                      // key={j}
                      key={`${rating._id}-star-${j}`}
                      size={16}
                      className={`star-icon ${j < rating.star_number ? "filled" : ""}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <p className="review-text">{rating.comment}</p>
          </div>
        ))
      ) : (
        <p>Chưa có đánh giá nào cho phim này.</p>
      )}
    </div>
  );
}
