import { useState, useEffect } from 'react';
import { getUserProfile, updateUserProfile } from '../../api/userApi';
import AvatarUpload from './AvatarUpload';
import '../../styles/Profile.css';

/**
 * ProfileCard Component
 * Hiển thị và cho phép cập nhật thông tin cá nhân của user
 */
const ProfileCard = () => {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    birthDate: '',
    gender: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await getUserProfile();
        setProfile(data);
        setFormData({
          fullName: data.full_name || '',
          email: data.email || '',
          phone: data.phone || '',
          birthDate: data.birth_date || '',
          gender: data.gender || '',
        });
      } catch (err) {
        setError('Không thể tải thông tin hồ sơ');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

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
      setProfile(prev => ({
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
      setError('Không thể cập nhật thông tin hồ sơ');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) return <div className="profile-loading">Đang tải thông tin...</div>;
  if (error) return <div className="profile-error">{error}</div>;

  return (
    <div className="profile-card">
      <div className="profile-header">
        <h2>Thông tin cá nhân</h2>
        <button 
          className="edit-profile-button"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Hủy' : 'Chỉnh sửa'}
        </button>
      </div>
      
      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}

      <div className="profile-content">
        <div className="avatar-section">
          <AvatarUpload 
            currentAvatar={profile?.avatar_url} 
            onAvatarUpdated={(newAvatarUrl) => {
              setProfile(prev => ({ ...prev, avatar_url: newAvatarUrl }));
            }} 
          />
          <p className="subscription-info">
            Gói dịch vụ: <span className="subscription-plan">{profile?.subscription_plan || 'Cơ bản'}</span>
          </p>
          <p className="device-info">
            Số thiết bị tối đa: <span className="max-devices">{profile?.max_devices || 1}</span>
          </p>
        </div>

        <div className="profile-details">
          {isEditing ? (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="fullName">Họ và tên</label>
                <input 
                  type="text" 
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input 
                  type="email" 
                  id="email"
                  name="email"
                  value={formData.email}
                  disabled // Email không thể thay đổi
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Số điện thoại</label>
                <input 
                  type="tel" 
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
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

              <button 
                type="submit" 
                className="save-button"
                disabled={loading}
              >
                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </form>
          ) : (
            <div className="profile-info">
              <div className="info-item">
                <span className="info-label">Họ và tên:</span>
                <span className="info-value">{profile?.full_name || 'Chưa cập nhật'}</span>
              </div>
              
              <div className="info-item">
                <span className="info-label">Email:</span>
                <span className="info-value">{profile?.email}</span>
              </div>
              
              <div className="info-item">
                <span className="info-label">Số điện thoại:</span>
                <span className="info-value">{profile?.phone || 'Chưa cập nhật'}</span>
              </div>
              
              <div className="info-item">
                <span className="info-label">Ngày sinh:</span>
                <span className="info-value">
                  {profile?.birth_date ? new Date(profile.birth_date).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                </span>
              </div>
              
              <div className="info-item">
                <span className="info-label">Giới tính:</span>
                <span className="info-value">
                  {profile?.gender ? 
                    (profile.gender === 'male' ? 'Nam' : 
                     profile.gender === 'female' ? 'Nữ' : 'Khác') : 
                    'Chưa cập nhật'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="profile-actions">
        <button className="action-button vip-button">Đăng ký tài khoản VIP</button>
        <button className="action-button">Lịch sử xem phim</button>
        <button className="action-button">Xem sau</button>
      </div>
    </div>
  );
};

export default ProfileCard; 