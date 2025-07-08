
// src/pages/Admin/MovieManagement.jsx
import React, { useEffect, useState } from 'react';
import { getAllMovies, deleteMovie, updateMovie } from '../../api/movieApi';
import '../../styles/Admin/MovieManagement.css';
import { baseImageUrl } from '../../config/constants';

const MovieManagement = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    runtime: '',
    release_date: ''
  });

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const res = await getAllMovies(filter);
      setMovies(res?.data || res || []);

    } catch (err) {
      console.error('Failed to fetch movies', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, [filter]);

  const handleDelete = async (movie) => {
    const movieId = movie._id || movie.id;
    console.log("Delete movie:", movie);

    if (!movieId) {
      console.error('Không có ID phim để xoá');
      return;
    }

    try {
      await deleteMovie(movieId);
      fetchMovies(); 
    } catch (error) {
      console.error('Failed to delete movie', error);
    }
  };

  const handleEdit = (movie) => {
    const movieId = movie._id || movie.id;
    setEditingMovie({ ...movie, _id: movieId });  // đảm bảo có _id
    setEditForm({
      title: movie.title || '',
      runtime: movie.runtime || '',
      release_date: movie.release_date || ''
    });
    setShowModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      await updateMovie(editingMovie._id, editForm);  // Gửi API update
      setEditingMovie(null); // đóng form
      fetchMovies();         // reload list
    } catch (error) {
      console.error('Failed to update movie', error);
    }
  };

  const handleAdd = () => {
    pass
  };

  return (
    <div className="admin-section">
      <h2>Quản lý phim</h2>
      {/* <input
        type="text"
        className="admin-search-input"
        placeholder="Tìm theo phim..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      /> */}
      {/* <button onClick={handleAdd}>➕ Thêm phim mới</button> */}
      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <>
          {/* FORM CHỈNH SỬA PHIM */}
          {showModal && (
            <div className="modal-overlay">
              <div className="edit-form">
                <h3>Chỉnh sửa phim: {editingMovie.title}</h3>
                <label>Tiêu đề:</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
                <label>Thời lượng (phút):</label>
                <input
                  type="number"
                  value={editForm.runtime}
                  onChange={(e) => setEditForm({ ...editForm, runtime: Number(e.target.value) })}
                />
                <label>Ngày phát hành:</label>
                <input
                  type="date"
                  value={editForm.release_date}
                  onChange={(e) => setEditForm({ ...editForm, release_date: e.target.value })}
                />
                <div className="form-actions">
                  <button onClick={handleSaveEdit} className="edit-button">💾 Lưu</button>
                  <button onClick={() => setShowModal(false)} className="delete-button">❌ Hủy</button>
                </div>
              </div>
            </div>
          )}
          <table className="admin-table">
            <colgroup>
              <col />
              <col />
              <col />
              <col />
              <col />
            </colgroup>
            <thead>
              <tr>
                <th>Poster</th>
                <th>Tiêu đề</th>
                <th>Thời lượng</th>
                <th>Ngày phát hành</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {movies.map((movie) => {
                const hours = Math.floor(movie.runtime / 60);
                const minutes = movie.runtime % 60;
                const durationStr = `${hours > 0 ? `${hours} giờ ` : ''}${minutes} phút`;

                return (
                  <tr key={movie._id}>
                    <td>
                      <img src={`${baseImageUrl}${movie.poster_path}`} alt={movie.title} />
                    </td>
                    <td style={{ color: 'white', fontWeight: 'normal' }}>{movie.title}</td>
                    <td>{durationStr}</td>
                    <td>{movie.release_date}</td>
                    <td className="action-buttons">
                      <button className="edit-button" onClick={() => handleEdit(movie)}>
                        ✏️ Chỉnh sửa
                      </button>
                      <button className="delete-button" onClick={() => handleDelete(movie)}>
                        🗑️ Xóa
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default MovieManagement;
