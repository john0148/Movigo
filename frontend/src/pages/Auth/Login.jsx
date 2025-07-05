/**
 * Login Page Component
 * 
 * Trang đăng nhập của ứng dụng Netflix clone.
 * Bao gồm:
 * - Form đăng nhập email/password
 * - Đăng nhập với Google
 * - Liên kết đến trang đăng ký
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { login, checkMongoDBStatus } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { showErrorToast } from '../../utils/errorHandler';
import '../../styles/Auth.css';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [usingFallbackData, setUsingFallbackData] = useState(false);
  const [checkingMongoDB, setCheckingMongoDB] = useState(false);
  const [mongoDBStatus, setMongoDBStatus] = useState(null);
  const [loginError, setLoginError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithGoogle: firebaseLoginWithGoogle, isLoading: authLoading, firebaseError, setUserFromNormalLogin } = useAuth();

  // Navigate to register page
  const handleRegisterClick = (e) => {
    e.preventDefault();
    navigate('/register');
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Kiểm tra xem có message được chuyển từ trang đăng ký không
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Xóa state để tránh hiển thị lại khi refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Xử lý thay đổi input
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData({ ...formData, [name]: newValue });

    // Xóa lỗi khi người dùng sửa input
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Vui lòng nhập email';
    }

    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Kiểm tra kết nối MongoDB
  const handleCheckMongoDBStatus = async () => {
    setCheckingMongoDB(true);
    try {
      const result = await checkMongoDBStatus();
      setMongoDBStatus(result);

      if (result.status === 'connected') {
        setSuccessMessage('Kết nối MongoDB thành công! Đang đăng nhập lại...');
        setUsingFallbackData(false);

        // Thử đăng nhập lại với thông tin người dùng hiện tại
        if (formData.email && formData.password) {
          handleSubmit(null, true);
        }
      } else {
        setUsingFallbackData(true);
        showErrorToast(`Không thể kết nối MongoDB: ${result.message}`);
      }
    } catch (error) {
      console.error('Error checking MongoDB status:', error);
      showErrorToast('Không thể kiểm tra trạng thái MongoDB');
    } finally {
      setCheckingMongoDB(false);
    }
  };

  // Xử lý đăng nhập
  const handleSubmit = async (e, skipValidation = false) => {
    if (e) e.preventDefault();

    if (!skipValidation && !validateForm()) return;

    setLoading(true);
    setUsingFallbackData(false);
    setMongoDBStatus(null);

    try {
      // Gọi API đăng nhập
      const authData = await login({
        email: formData.email,
        password: formData.password,
        remember_me: formData.rememberMe
      });

      console.log('Login successful, authData:', authData);

      // Update AuthContext với user data từ response
      if (authData && authData.user) {
        setUserFromNormalLogin(authData.user);
        console.log('Updated AuthContext with user:', authData.user.email);
      }

      // Kiểm tra xem có đang sử dụng dữ liệu fallback hay không
      if (authData && authData.access_token && authData.access_token.startsWith('mock-token')) {
        console.log('Đang sử dụng dữ liệu fallback vì không thể kết nối đến MongoDB');
        setUsingFallbackData(true);

        // Automatically continue with fallback data without showing warning
        const redirectTo = location.state?.from || '/';
        navigate(redirectTo);
      } else {
        // Chuyển hướng ngay lập tức nếu dữ liệu từ MongoDB
        const redirectTo = location.state?.from || '/';
        navigate(redirectTo);
      }
    } catch (error) {
      // console.error('Đăng nhập thất bại:', error);
      // showErrorToast(error.message || 'Đăng nhập thất bại');
      console.error("🔴 Đăng nhập thất bại:", error.message);
      setLoginError(error.message);
      // showErrorToast(error.message); 
    } finally {
      setLoading(false);
    }
  };

  // Tiếp tục với dữ liệu cục bộ
  const continueWithFallbackData = () => {
    // Chuyển đến trang chủ hoặc trang được chuyển hướng
    const redirectTo = location.state?.from || '/';
    navigate(redirectTo);
  };

  // Xử lý đăng nhập với Google Firebase
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      
      // Sử dụng Firebase Google auth từ context
      await firebaseLoginWithGoogle();
      
      console.log('Google login successful, navigating...');
      
      // Chuyển hướng đến trang chủ sau khi đăng nhập thành công
      const redirectTo = location.state?.from || '/';
      navigate(redirectTo);
    } catch (error) {
      console.error('Đăng nhập Google thất bại:', error);
      showErrorToast(error.message || 'Đăng nhập Google thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page login-page">
      <div className="auth-overlay"></div>

      <div className="auth-header">
        <Link to="/" className="auth-logo">MOVIGO</Link>
      </div>

      <div className="auth-container">
        <div className="auth-form-container">
          <h1 className="auth-title">Đăng nhập</h1>

          {successMessage && (
            <div className="success-message">{successMessage}</div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Nhập địa chỉ email"
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <div className="error-message">{errors.email}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Mật khẩu</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu"
                  className={errors.password ? 'error' : ''}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <div className="error-message">{errors.password}</div>}
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                <span className="checkbox-text">Ghi nhớ đăng nhập</span>
              </label>
              <Link to="/forgot-password" className="forgot-password">Quên mật khẩu?</Link>
            </div>
    
            {loginError && (
              <div className="auth-error">{loginError}</div>
            )}

            <button
              type="submit"
              className="auth-button"
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>

            <div className="auth-separator">
              <span>Hoặc</span>
            </div>

            <button
              type="button"
              className="google-button"
              onClick={handleGoogleLogin}
              disabled={loading || authLoading || !!firebaseError}
              title={firebaseError ? 'Firebase chưa được cấu hình' : ''}
            >
              <img src="/assets/google-icon.svg" alt="Google" className="google-icon" />
              {firebaseError 
                ? 'Firebase chưa cấu hình' 
                : (loading || authLoading) 
                  ? 'Đang xử lý...' 
                  : 'Đăng nhập với Google'
              }
            </button>
          </form>

          <div className="auth-footer">
            Chưa có tài khoản?
            <span
              className="auth-link"
              onClick={handleRegisterClick}
              style={{ cursor: 'pointer' }}
            >
              Đăng ký ngay
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login; 