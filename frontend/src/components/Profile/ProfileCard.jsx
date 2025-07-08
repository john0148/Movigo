import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../../api/authApi';
import { updateUserProfile } from '../../api/userApi';
import AvatarUpload from './AvatarUpload';
import { SUBSCRIPTION_TYPES, USER_DATA_KEY } from '../../config/constants';
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
      try {
        setLoading(true);

        // Ưu tiên sử dụng user từ context
        if (contextUser) {
          console.log('Using user from context:', contextUser.email);
          setUser(contextUser);
          setFormData({
            fullName: contextUser.full_name || '',
            email: contextUser.email || '',
            phone: contextUser.phone || '',
            birthDate: contextUser.birth_date || '',
            gender: contextUser.gender || '',
          });
          setLoading(false);
          return;
        }

        // Nếu không có trong context, thử lấy từ localStorage
        const storedUserData = localStorage.getItem(USER_DATA_KEY);
        if (storedUserData) {
          try {
            const userData = JSON.parse(storedUserData);
            console.log('Using user from localStorage:', userData.email);
            setUser(userData);
            setFormData({
              fullName: userData.full_name || '',
              email: userData.email || '',
              phone: userData.phone || '',
              birthDate: userData.birth_date || '',
              gender: userData.gender || '',
            });
            setLoading(false);
            return;
          } catch (error) {
            console.error('Error parsing user data from localStorage:', error);
          }
        }

        // Nếu không có ở cả 2 nơi, thử gọi API
        console.log('Getting user data from API');
        const userData = await getCurrentUser();
        if (userData) {
          console.log('Got user from API:', userData.email);
          setUser(userData);
          setFormData({
            fullName: userData.full_name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            birthDate: userData.birth_date || '',
            gender: userData.gender || '',
          });
        } else {
          // Nếu tất cả đều thất bại, chuyển hướng đến trang đăng nhập
          console.error('No user data found, redirecting to login');
          navigate('/login');
        }
      } catch (error) {
        console.error('Error in ProfileCard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [contextUser, navigate]);

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
      
      // Prepare data for backend - only include non-empty values
      const updateData = {};
      
      if (formData.fullName && formData.fullName.trim()) {
        updateData.full_name = formData.fullName.trim();
      }
      
      if (formData.phone && formData.phone.trim()) {
        updateData.phone = formData.phone.trim();
      }
      
      if (formData.birthDate) {
        updateData.birth_date = formData.birthDate; // YYYY-MM-DD format
      }
      
      if (formData.gender) {
        updateData.gender = formData.gender;
      }
      
      // Only send if we have at least one field to update
      if (Object.keys(updateData).length === 0) {
        setSuccessMessage('Không có thông tin nào để cập nhật');
        setIsEditing(false);
        return;
      }
      
      console.log('Submitting profile update:', updateData);
      const updatedProfile = await updateUserProfile(updateData);
      
      console.log('Profile updated successfully:', updatedProfile);

      // Sử dụng dữ liệu mới từ API response thay vì merge dữ liệu cũ
      if (updatedProfile) {
        setUser(updatedProfile);
        
        // Cập nhật localStorage với dữ liệu mới từ database
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(updatedProfile));
        console.log('Updated user data in localStorage with fresh data from API');
        
        // Cập nhật form data với dữ liệu mới
        setFormData({
          fullName: updatedProfile.full_name || '',
          email: updatedProfile.email || '',
          phone: updatedProfile.phone || '',
          birthDate: updatedProfile.birth_date || '',
          gender: updatedProfile.gender || '',
        });
      }

      setIsEditing(false);
      setSuccessMessage('Cập nhật thông tin thành công');

      // Xóa thông báo thành công sau 3 giây
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error updating user profile:', err);
      setSuccessMessage('Lỗi: ' + (err.message || 'Không thể cập nhật thông tin hồ sơ'));
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
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
      case SUBSCRIPTION_TYPES.PREMIUM: return '#e50914'; // Red for premium
      case SUBSCRIPTION_TYPES.STANDARD: return '#ffb92a'; // Yellow for standard
      case SUBSCRIPTION_TYPES.BASIC: return '#2596be'; // Blue for basic
      case SUBSCRIPTION_TYPES.FREE: return '#ffffff'; // White for free
      default: return '#ffffff'; // Default to white
    }
  };

  // Function to get subscription plan icon
  const getSubscriptionIcon = () => {
    switch (user.subscription_plan) {
      case SUBSCRIPTION_TYPES.PREMIUM: return '👑'; // Crown for premium
      case SUBSCRIPTION_TYPES.STANDARD: return '⭐'; // Star for standard
      case SUBSCRIPTION_TYPES.BASIC: return '✓'; // Check mark for basic
      case SUBSCRIPTION_TYPES.FREE: return '🔹'; // Diamond for free
      default: return '🔹'; // Default to free icon
    }
  };

  // Function to get subscription plan name
  const getSubscriptionName = () => {
    switch (user.subscription_plan) {
      case SUBSCRIPTION_TYPES.PREMIUM: return 'Premium';
      case SUBSCRIPTION_TYPES.STANDARD: return 'Standard';
      case SUBSCRIPTION_TYPES.BASIC: return 'Cơ bản';
      case SUBSCRIPTION_TYPES.FREE: return 'Miễn phí';
      default: return 'Miễn phí';
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
              <span className="subscription-icon">{getSubscriptionIcon()}</span>
              <span className="subscription-text">{getSubscriptionName()}</span>
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
              <div className="form-group required">
                <label htmlFor="fullName">Họ và tên</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Nhập họ và tên"
                  required
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
                  <option value="">Chọn...</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                  <option value="prefer_not_to_say">Không muốn chia sẻ</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className={`save-button ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? 'Đang lưu...' : 'Lưu thay đổi'} {!loading && <span>💾</span>}
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
                          : user.gender === 'other' ? 'Khác'
                            : user.gender === 'prefer_not_to_say' ? 'Không muốn chia sẻ'
                              : user.gender)
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
    </div>
  );
};

export default ProfileCard; 