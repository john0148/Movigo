import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import ProfileCard from '../../components/Profile/ProfileCard';
import WatchStats from '../../components/Profile/WatchStats';
import { getCurrentUser, isAuthenticated } from '../../api/authApi';
import '../../styles/Profile.css';

/**
 * ProfileMain Component
 * Trang chính quản lý hồ sơ người dùng, hiển thị:
 * 1. Thông tin cá nhân có thể chỉnh sửa
 * 2. Biểu đồ thống kê thời lượng xem phim
 * 3. Các nút điều hướng đến các trang con
 */
const ProfileMain = () => {
  const navigate = useNavigate();
  const { user: contextUser } = useOutletContext() || { user: null };
  const [user, setUser] = useState(contextUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndFetchUser = async () => {
      try {
        // Check if user is authenticated
        if (!isAuthenticated() && !contextUser) {
          console.log('User not authenticated, redirecting to login');
          navigate('/login', { state: { message: 'Vui lòng đăng nhập để xem trang này' } });
          return;
        }

        // If we have user from context, use it
        if (contextUser) {
          setUser(contextUser);
          setLoading(false);
          return;
        }

        // Otherwise fetch user data
        try {
          const userData = await getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error('Error fetching user data:', error);
          navigate('/login', { state: { message: 'Vui lòng đăng nhập để xem trang này' } });
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchUser();
  }, [contextUser, navigate]);

  if (loading) {
    return (
      <div className="profile-loading-container">
        <div className="profile-loading-spinner"></div>
        <p>Đang tải thông tin hồ sơ...</p>
      </div>
    );
  }

  return (
    <div className="profile-page-container">
      <div className="profile-header">
        <h1>Hồ sơ của tôi</h1>
      </div>

      <div className="profile-sections">
        {/* Thông tin cá nhân */}
        <section className="profile-section">
          <ProfileCard />
        </section>

        {/* Biểu đồ thống kê */}
        <section className="profile-section stats-section">
          <WatchStats />
        </section>

        {/* Các liên kết/hành động */}
        <section className="profile-section links-section">
          <div className="profile-links">
            <div className="profile-link-card" onClick={() => navigate('/profile/vip')}>
              <div className="link-icon vip-icon">🌟</div>
              <h3>Nâng cấp VIP</h3>
              <p>Xem phim không giới hạn với chất lượng cao nhất</p>
            </div>
            <div className="profile-link-card" onClick={() => navigate('/profile/history')}>
              <div className="link-icon history-icon">🕒</div>
              <h3>Lịch sử xem</h3>
              <p>Xem danh sách phim bạn đã xem gần đây</p>
            </div>
            <div className="profile-link-card" onClick={() => navigate('/profile/watchlater')}>
              <div className="link-icon watchlater-icon">📋</div>
              <h3>Xem sau</h3>
              <p>Danh sách phim bạn đã lưu để xem sau</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProfileMain; 