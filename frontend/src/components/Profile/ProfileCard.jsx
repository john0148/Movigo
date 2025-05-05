import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../../api/authApi';
import { updateUserProfile } from '../../api/userApi';
import AvatarUpload from './AvatarUpload';
import '../../styles/Profile.css';

/**
 * ProfileCard Component
 * Displays the user's profile information
 */
const ProfileCard = () => {
  const { user: contextUser } = useOutletContext() || { user: null };
  const [user, setUser] = useState(contextUser);
  const [loading, setLoading] = useState(!contextUser);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    birthDate: '',
    gender: '',
  });
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      if (contextUser) {
        setUser(contextUser);
        setLoading(false);
        setFormData({
          fullName: contextUser.full_name || '',
          email: contextUser.email || '',
          phone: contextUser.phone || '',
          birthDate: contextUser.birth_date || '',
          gender: contextUser.gender || '',
        });
        return;
      }

      try {
        const userData = await getCurrentUser();
        setUser(userData);
        setLoading(false);
        setFormData({
          fullName: userData.full_name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          birthDate: userData.birth_date || '',
          gender: userData.gender || '',
        });
      } catch (error) {
        console.error('Error fetching user data for ProfileCard:', error);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [contextUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      await updateUserProfile({
        full_name: formData.fullName,
        birth_date: formData.birthDate,
        gender: formData.gender,
        phone: formData.phone,
      });

      // Cập nhật profile hiện tại
      setUser(prev => ({
        ...prev,
        full_name: formData.fullName,
        birth_date: formData.birthDate,
        gender: formData.gender,
        phone: formData.phone,
      }));

      setIsEditing(false);
      setSuccessMessage('Cập nhật thông tin thành công');

      // Xóa thông báo thành công sau 3 giây
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error updating user profile:', err);
      setSuccessMessage('Không thể cập nhật thông tin hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-card-skeleton">
        <div className="skeleton-header"></div>
        <div className="skeleton-content">
          <div className="skeleton-avatar"></div>
          <div className="skeleton-info">
            <div className="skeleton-line"></div>
            <div className="skeleton-line"></div>
            <div className="skeleton-line"></div>
            <div className="skeleton-line"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-card profile-card-error">
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <h3>Không thể tải thông tin người dùng</h3>
          <p>Vui lòng thử lại sau hoặc liên hệ hỗ trợ</p>
        </div>
      </div>
    );
  }

  const getSubscriptionColor = () => {
    switch (user.subscription_plan) {
      case 'premium': return '#e50914'; // Netflix red
      case 'standard': return '#ffb92a'; // Gold
      case 'basic': return '#2596be'; // Blue
      default: return '#777'; // Grey for free
    }
  };

  return (
    <div className="profile-card">
      <div className="profile-card-header">
        <h2>Thông tin cá nhân</h2>
        <button
          className={`edit-button ${isEditing ? 'cancel-button' : ''}`}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Hủy' : 'Chỉnh sửa'}
          <span className="edit-icon">{isEditing ? '✕' : '✎'}</span>
        </button>
      </div>

      {successMessage && (
        <div className="success-message">
          <span className="success-icon">✓</span>
          {successMessage}
        </div>
      )}

      <div className="profile-card-content">
        <div className="profile-main-info">
          <div className="avatar-container">
            <AvatarUpload
              currentAvatar={user?.avatar_url}
              onAvatarUpdated={(newAvatarUrl) => {
                setUser(prev => ({ ...prev, avatar_url: newAvatarUrl }));
              }}
            />
            <div
              className="subscription-badge"
              style={{ backgroundColor: getSubscriptionColor() }}
            >
              {user.subscription_plan === 'premium' ? 'Premium' :
                user.subscription_plan === 'standard' ? 'Standard' :
                  user.subscription_plan === 'basic' ? 'Cơ bản' : 'Miễn phí'}
            </div>
          </div>

          <div className="main-user-info">
            <h3 className="user-name">{user.full_name || 'Người dùng'}</h3>
            <div className="user-metadata">
              <div className="metadata-item">
                <span className="metadata-icon">✉️</span>
                <span>{user.email}</span>
              </div>
              <div className="metadata-item">
                <span className="metadata-icon">👤</span>
                <span>{user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}</span>
              </div>
            </div>
          </div>
        </div>

        {isEditing ? (
          <form className="profile-edit-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="fullName">Họ và tên</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Nhập họ và tên"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="disabled-input"
                />
                <small className="field-hint">Email không thể thay đổi</small>
              </div>

              <div className="form-group">
                <label htmlFor="phone">Số điện thoại</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <div className="form-group">
                <label htmlFor="birthDate">Ngày sinh</label>
                <input
                  type="date"
                  id="birthDate"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="gender">Giới tính</label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="">Chọn giới tính</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="save-button"
                disabled={loading}
              >
                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-details">
            <h3 className="details-section-title">
              <span className="section-icon">📋</span>
              Thông tin chi tiết
            </h3>

            <div className="details-grid">
              <div className="detail-item">
                <div className="detail-icon-container">
                  <span className="detail-icon">👤</span>
                </div>
                <div className="detail-content">
                  <span className="detail-label">Họ và tên</span>
                  <span className="detail-value">{user.full_name || 'Chưa cập nhật'}</span>
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-icon-container">
                  <span className="detail-icon">✉️</span>
                </div>
                <div className="detail-content">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{user.email}</span>
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-icon-container">
                  <span className="detail-icon">📱</span>
                </div>
                <div className="detail-content">
                  <span className="detail-label">Số điện thoại</span>
                  <span className="detail-value">{user.phone || 'Chưa cập nhật'}</span>
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-icon-container">
                  <span className="detail-icon">🎂</span>
                </div>
                <div className="detail-content">
                  <span className="detail-label">Ngày sinh</span>
                  <span className="detail-value">
                    {user.birth_date
                      ? new Date(user.birth_date).toLocaleDateString('vi-VN')
                      : 'Chưa cập nhật'}
                  </span>
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-icon-container">
                  <span className="detail-icon">⚧️</span>
                </div>
                <div className="detail-content">
                  <span className="detail-label">Giới tính</span>
                  <span className="detail-value">
                    {user.gender
                      ? (user.gender === 'male' ? 'Nam'
                        : user.gender === 'female' ? 'Nữ'
                          : 'Khác')
                      : 'Chưa cập nhật'}
                  </span>
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-icon-container">
                  <span className="detail-icon">📅</span>
                </div>
                <div className="detail-content">
                  <span className="detail-label">Ngày tham gia</span>
                  <span className="detail-value">
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString('vi-VN')
                      : new Date().toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="profile-actions">
        <button
          className="action-button primary-action"
          onClick={() => navigate('/profile/vip')}
        >
          <span className="action-icon">🌟</span>
          Nâng cấp tài khoản VIP
        </button>
        <div className="action-button-group">
          <button
            className="action-button"
            onClick={() => navigate('/profile/history')}
          >
            <span className="action-icon">🕒</span>
            Lịch sử xem phim
          </button>
          <button
            className="action-button"
            onClick={() => navigate('/profile/watchlater')}
          >
            <span className="action-icon">📋</span>
            Xem sau
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard; 