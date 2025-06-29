import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function MoviePlayer() {
  const { id: movieId } = useParams();
  const [fileId, setFileId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDriveFileId = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8000/api/v1/movies/${movieId}/drive-url`
        );
        setFileId(res.data.drive_url);
      } catch (err) {
        console.error("Lỗi khi lấy file ID Google Drive:", err);
        setError("Không tìm được video.");
      }
    };

    fetchDriveFileId();
  }, [movieId]);

  if (error) {
    return <div style={{ textAlign: "center", marginTop: "2rem" }}>{error}</div>;
  }

  if (!fileId) {
    return <div style={{ textAlign: "center", marginTop: "2rem" }}>Đang tải video...</div>;
  }

  return (
    <div className="video-page" style={{ maxWidth: "1000px", margin: "0 auto", padding: "2rem" }}>
      <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>Xem Phim</h2>
      <iframe
        src={`https://drive.google.com/file/d/${fileId}/preview`}
        width="100%"
        height="600px"
        allow="autoplay"
        allowFullScreen
        style={{ border: "none", backgroundColor: "black" }}
      ></iframe>
    </div>
  );
}
