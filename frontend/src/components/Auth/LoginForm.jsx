import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { login } from '../../api/authApi';
import GoogleAuth from './GoogleAuth';
import '../styles/Auth.css';

/**
 * LoginForm Component
 * Hiển thị form đăng nhập với email, mật khẩu và đăng nhập bằng Google
 */
const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Get the refreshUserFromStorage function from context
  const { refreshUserFromStorage } = useOutletContext() || {};

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Attempting login with:', formData.email);

      const response = await login({
        email: formData.email,
        password: formData.password
      });

      console.log('Login successful, response:', response.user ? 'User data received' : 'No user data');

      // Manually force refresh user data from localStorage
      if (refreshUserFromStorage) {
        console.log('Refreshing user data from localStorage after login');
        const userData = refreshUserFromStorage();
        console.log('User data after refresh:', userData ? 'available' : 'not available');
      } else {
        console.warn('refreshUserFromStorage not available in context');
      }

      // Force a timeout to allow localStorage update
      setTimeout(() => {
        // Chuyển hướng đến trang chủ với state refresh
        navigate('/', { state: { refreshUser: true } });
      }, 500);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.detail || 'Đăng nhập không thành công');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      <h2>Đăng nhập</h2>

      {/* {error && <div className="auth-error">{error}</div>} */}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Nhập email của bạn"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Mật khẩu</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Nhập mật khẩu"
            required
          />
        </div>
        
        {error && <div className="auth-error">{error}</div>}

        <button type="submit" className="auth-button" disabled={isLoading}>
          {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>

      <div className="auth-divider">
        <span>hoặc</span>
      </div>

      <GoogleAuth />

      <div className="auth-links">
        <a href="/forgot-password">Quên mật khẩu?</a>
        <a href="/register">Chưa có tài khoản? Đăng ký ngay</a>
      </div>
    </div>
  );
};

export default LoginForm; 