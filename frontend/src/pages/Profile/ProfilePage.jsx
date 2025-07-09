// * Profile Page Component
//  * 
//  * Trang hồ sơ người dùng của Netflix clone.
//  * Bao gồm:
//  * - Hiển thị thông tin cá nhân
//  * - Chức năng upload ảnh đại diện
//  * - Cập nhật thông tin cá nhân
//  * - Các liên kết đến các trang con khác (VIP, lịch sử, xem sau...)
//  * - Biểu đồ thời lượng xem phim
//  */

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserProfile, updateProfile, uploadAvatar } from '../../api/profileApi';
import { getWatchStats } from '../../api/watchHistoryApi';
import { logout } from '../../api/authApi';
import { ALLOWED_AVATAR_TYPES, MAX_AVATAR_SIZE, DEFAULT_AVATAR_URL } from '../../config/constants';
import { showErrorToast } from '../../utils/errorHandler';
import LoadingSpinner from '../../components/LoadingSpinner';
import WatchStatsChart from '../../components/Profile/WatchStatsChart';
import '../../styles/Profile.css';

function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [watchStats, setWatchStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    birth_date: '',
    gender: ''
  });
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Tải thông tin hồ sơ khi trang được tải
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const profileData = await getUserProfile();
        setProfile(profileData);

        // Khởi tạo formData từ profile
        setFormData({
          full_name: profileData.full_name || '',
          phone: profileData.phone || '',
          birth_date: profileData.birth_date ? profileData.birth_date.substring(0, 10) : '',
          gender: profileData.gender || ''
        });

        // Tải thống kê xem phim
        if (activeTab === 'stats') {
          const stats = await getWatchStats();
          setWatchStats(stats);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching profile:', error);
        showErrorToast(error.message);
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [activeTab]);

  // Xử lý thay đổi tab
  const handleTabChange = async (tab) => {
    setActiveTab(tab);

    // Tải thống kê xem phim khi chuyển đến tab "stats"
    if (tab === 'stats' && !watchStats) {
      try {
        const stats = await getWatchStats();
        setWatchStats(stats);
      } catch (error) {
        console.error('Error fetching watch stats:', error);
        showErrorToast(error.message);
      }
    }
  };

  // Xử lý thay đổi input form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Xử lý gửi form cập nhật hồ sơ
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setUpdating(true);
      const updatedProfile = await updateProfile(formData);
      setProfile(updatedProfile);
      setIsEditing(false);
      showErrorToast('Cập nhật hồ sơ thành công!');
    } catch (error) {
      console.error('Error updating profile:', error);
      showErrorToast(error.message);
    } finally {
      setUpdating(false);
    }
  };

  // Xử lý mở dialog chọn file ảnh đại diện
  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  // Xử lý upload ảnh đại diện
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Kiểm tra kích thước file
    if (file.size > MAX_AVATAR_SIZE) {
      showErrorToast(`Kích thước file quá lớn. Tối đa ${MAX_AVATAR_SIZE / (1024 * 1024)}MB.`);
      return;
    }

    // Kiểm tra loại file
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      showErrorToast('Loại file không hỗ trợ. Chỉ chấp nhận JPEG, PNG, và GIF.');
      return;
    }

    try {
      setUpdating(true);
      const formData = new FormData();
      formData.append('avatar', file);

      const result = await uploadAvatar(formData);
      setProfile({ ...profile, avatar_url: result.avatar_url });

      showErrorToast('Ảnh đại diện đã được cập nhật!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      showErrorToast(error.message);
    } finally {
      setUpdating(false);
    }
  };

  // Xử lý đăng xuất
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>Hồ sơ của tôi</h1>
        <button className="logout-button" onClick={handleLogout}>
          Đăng xuất
        </button>
      </div>

      <div className="profile-content">
        <div className="profile-sidebar">
          {/* Ảnh đại diện */}
          <div className="avatar-container">
            <div className="avatar" onClick={handleAvatarClick}>
              <img
                src={profile.avatar_url || DEFAULT_AVATAR_URL}
                alt="Avatar"
                className="avatar-image"
              />
              <div className="avatar-overlay">
                <span>Thay đổi</span>
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
              accept="image/jpeg,image/png,image/gif"
            />
          </div>

          {/* Tên người dùng */}
          <h2 className="profile-name">{profile.full_name || profile.email}</h2>

          {/* Thông tin gói */}
          <div className="subscription-info">
            <span className="subscription-label">Gói hiện tại:</span>
            <span className="subscription-value">
              {profile.subscription_type === 'premium' ? 'Cao cấp' :
                profile.subscription_type === 'standard' ? 'Tiêu chuẩn' : 'Cơ bản'}
            </span>
          </div>

          {/* Menu điều hướng */}
          <nav className="profile-nav">
            <button
              className={`nav-item ${activeTab === 'info' ? 'active' : ''}`}
              onClick={() => handleTabChange('info')}
            >
              Thông tin cá nhân
            </button>
            <button
              className={`nav-item ${activeTab === 'stats' ? 'active' : ''}`}
              onClick={() => handleTabChange('stats')}
            >
              Thống kê xem phim
            </button>
            <Link to="/profile/history" className="nav-item">
              Lịch sử xem phim
            </Link>
            <Link to="/profile/watchlater" className="nav-item">
              Xem sau
            </Link>
            <Link to="/subscription" className="nav-item upgrade">
              Nâng cấp tài khoản VIP
            </Link>
          </nav>
        </div>

        <div className="profile-main">
          {activeTab === 'info' && (
            <div className="profile-info">
              <div className="section-header">
                <h2>Thông tin cá nhân</h2>
                {!isEditing && (
                  <button
                    className="edit-button"
                    onClick={() => setIsEditing(true)}
                  >
                    Chỉnh sửa
                  </button>
                )}
              </div>

              {isEditing ? (
                // Form chỉnh sửa
                <form className="profile-form" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="full_name">Họ tên</label>
                    <input
                      type="text"
                      id="full_name"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      placeholder="Nhập họ tên của bạn"
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
                      placeholder="Nhập số điện thoại"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="birth_date">Ngày sinh</label>
                    <input
                      type="date"
                      id="birth_date"
                      name="birth_date"
                      value={formData.birth_date}
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
                      <option value="prefer_not_to_say">Không muốn tiết lộ</option>
                    </select>
                  </div>

                  <div className="form-group info-item">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{profile.email}</span>
                    <span className="info-note">(không thể thay đổi)</span>
                  </div>

                  <div className="form-buttons">
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={() => setIsEditing(false)}
                      disabled={updating}
                    >
                      Hủy
                    </button>

                    <button
                      type="submit"
                      className="save-button"
                      disabled={updating}
                    >
                      {updating ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                  </div>
                </form>
              ) : (
                // Hiển thị thông tin
                <div className="info-display">
                  <div className="info-item">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{profile.email}</span>
                  </div>

                  <div className="info-item">
                    <span className="info-label">Họ tên:</span>
                    <span className="info-value">{profile.full_name || 'Chưa cập nhật'}</span>
                  </div>

                  <div className="info-item">
                    <span className="info-label">Số điện thoại:</span>
                    <span className="info-value">{profile.phone || 'Chưa cập nhật'}</span>
                  </div>

                  <div className="info-item">
                    <span className="info-label">Ngày sinh:</span>
                    <span className="info-value">
                      {profile.birth_date
                        ? new Date(profile.birth_date).toLocaleDateString('vi-VN')
                        : 'Chưa cập nhật'}
                    </span>
                  </div>

                  <div className="info-item">
                    <span className="info-label">Giới tính:</span>
                    <span className="info-value">
                      {profile.gender === 'male' ? 'Nam' :
                        profile.gender === 'female' ? 'Nữ' :
                          profile.gender === 'other' ? 'Khác' :
                            profile.gender === 'prefer_not_to_say' ? 'Không muốn tiết lộ' :
                              'Chưa cập nhật'}
                    </span>
                  </div>

                  <div className="info-item">
                    <span className="info-label">Ngày tham gia:</span>
                    <span className="info-value">
                      {new Date(profile.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <div className="info-item">
                    <span className="info-label">Số thiết bị tối đa:</span>
                    <span className="info-value">{profile.max_devices}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="watch-stats">
              <h2>Thống kê xem phim</h2>

              {watchStats ? (
                <>
                  <div className="stats-summary">
                    <div className="stat-card">
                      <div className="stat-value">{watchStats.total_movies}</div>
                      <div className="stat-label">Phim đã xem</div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-value">{watchStats.total_minutes}</div>
                      <div className="stat-label">Phút xem</div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-value">{watchStats.favorite_genre || 'N/A'}</div>
                      <div className="stat-label">Thể loại yêu thích</div>
                    </div>
                  </div>

                  <div className="stats-charts">
                    <div className="chart-container">
                      <h3>Thời lượng xem theo tuần</h3>
                      {watchStats.weekly_stats.length > 0 ? (
                        <WatchStatsChart
                          data={watchStats.weekly_stats}
                          xKey="week"
                          yKey="minutes_watched"
                          xLabel="Tuần"
                          yLabel="Phút xem"
                        />
                      ) : (
                        <p className="no-data">Chưa có dữ liệu</p>
                      )}
                    </div>

                    <div className="chart-container">
                      <h3>Thời lượng xem theo tháng</h3>
                      {watchStats.monthly_stats.length > 0 ? (
                        <WatchStatsChart
                          data={watchStats.monthly_stats}
                          xKey="month"
                          yKey="minutes_watched"
                          xLabel="Tháng"
                          yLabel="Phút xem"
                        />
                      ) : (
                        <p className="no-data">Chưa có dữ liệu</p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <LoadingSpinner size="small" text="Đang tải dữ liệu..." />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage; 