// src/pages/Admin/UserManagement.jsx
import React, { useEffect, useState } from 'react';
import { getAllUsers, deleteUser, updateUsers } from '../../api/userApi';
import '../../styles/Admin/UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    subscription_plan: ''
  });


  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getAllUsers();
      setUsers(res?.data || res || []);

    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (userId) => {
    if (!window.confirm('Bạn có chắc muốn xoá user này?')) return;
    try {
      await deleteUser(userId);
      fetchUsers();
    } catch (err) {
      console.error('Failed to delete user', err);
    }
  };

  const handleEdit = (user) => {
    setSelectedUser({ ...user, _id: user._id || user.id });
    setEditForm({
      full_name: user.full_name || '',
      subscription_plan: user.subscription_plan || ''
    });
    setShowModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser?.id) return;

    try {
      await updateUsers(selectedUser._id || selectedUser.id, editForm);
      setShowModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Failed to update user', error);
    }
  };

  const handleAdd = () => {
    setSelectedUser(null);
    setShowModal(true);
  };

  return (
    <div className="admin-section">
      <h2>Quản lý người dùng</h2>
      {/* <button onClick={handleAdd}>➕ Thêm user mới</button> */}
      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <>
          {showModal && selectedUser && (
            <div className="modal-overlay">
              <div className="modal-content edit-form">
                <h3>Chỉnh sửa người dùng: {selectedUser.email}</h3>
                <p className="text-line">
                  <strong>Họ tên:</strong> <span>{selectedUser.full_name}</span>
                </p>

                <label>Gói đăng ký:</label>
                <select
                  value={editForm.subscription_plan}
                  onChange={(e) => setEditForm({ ...editForm, subscription_plan: e.target.value })}
                  style={{
                    padding: '0.6rem 0.8rem',
                    backgroundColor: '#2e1065',
                    color: '#fff',
                    borderRadius: '6px',
                    border: '1px solid #a78bfa',
                    marginBottom: '1.2rem'
                  }}
                >
                  <option value="">-- Chọn gói --</option>
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                </select>

                <div className="form-actions">
                  <button onClick={handleSaveEdit} className="edit-button">💾 Lưu</button>
                  <button onClick={() => setShowModal(false)} className="delete-button">❌ Hủy</button>
                </div>
              </div>
            </div>
          )}
          <table className="admin-table">
            <colgroup>
              <col style={{ width: "27%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "22%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>Email</th>
                <th>Họ tên</th>
                <th>Gói đăng ký</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                return (
                  <tr key={user.id}>
                    <td>{user.email}</td>
                    <td>{user.full_name}</td>
                    <td>{user.subscription_plan || 'Chưa đăng ký'}</td>
                    <td>{new Date(user.created_at).toLocaleString()}</td>
                    <td className="action-buttons">
                      <button className="edit-button" onClick={() => handleEdit(user)}>
                        ✏️ Chỉnh sửa
                      </button>
                      <button className="delete-button" onClick={() => handleDelete(user.id)}>
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

export default UserManagement;
