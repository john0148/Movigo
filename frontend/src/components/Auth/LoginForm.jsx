import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
      const response = await login(formData.email, formData.password);
      
      // Lưu token vào localStorage
      localStorage.setItem('token', response.access_token);
      
      // Chuyển hướng đến trang chủ
      navigate('/');
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
      
      {error && <div className="auth-error">{error}</div>}
      
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