/**
 * Register Page Component
 * 
 * Trang đăng ký tài khoản mới của Netflix clone.
 * Bao gồm:
 * - Form đăng ký với các trường: email, mật khẩu, chọn gói dịch vụ, số điện thoại
 * - Validation form
 * - Hỗ trợ đăng ký bằng Google
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register, loginWithGoogle } from '../../api/authApi';
import { SUBSCRIPTION_TYPES } from '../../config/constants';
import { showErrorToast } from '../../utils/errorHandler';
import '../../styles/Auth.css';

function Register() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    subscription_type: 'basic',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // Xử lý thay đổi input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Xóa lỗi khi người dùng sửa input
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Validate email
    if (!formData.email) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    // Chỉ validate các trường khác ở step 2
    if (step === 2) {
      // Validate password
      if (!formData.password) {
        newErrors.password = 'Mật khẩu là bắt buộc';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
      }

      // Validate confirm password
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
      }

      // Validate phone (không bắt buộc nhưng phải đúng định dạng nếu nhập)
      if (formData.phone && !/^\d{10,11}$/.test(formData.phone)) {
        newErrors.phone = 'Số điện thoại không hợp lệ';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Xử lý chuyển bước
  const handleNextStep = (e) => {
    e.preventDefault();

    if (validateForm()) {
      if (step === 1) {
        setStep(2);
      } else {
        handleSubmit(e);
      }
    }
  };

  // Xử lý gửi form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      // Gọi API đăng ký
      await register({
        email: formData.email,
        password: formData.password,
        subscription_plan: formData.subscription_type,
        phone: formData.phone || undefined
      });

      // Chuyển hướng đến trang đăng nhập sau khi đăng ký thành công
      navigate('/login', {
        state: {
          message: 'Đăng ký thành công! Vui lòng đăng nhập.'
        }
      });
    } catch (error) {
      console.error('Đăng ký thất bại:', error);
      showErrorToast(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý đăng ký bằng Google
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // Khởi tạo đăng nhập Google
      const response = await loginWithGoogle();

      // Chuyển hướng đến trang chủ sau khi đăng nhập thành công
      navigate('/');
    } catch (error) {
      console.error('Đăng nhập Google thất bại:', error);
      showErrorToast(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page register-page">
      <div className="auth-overlay"></div>

      <div className="auth-header">
        <Link to="/" className="auth-logo">MOVIGO</Link>
      </div>

      <div className="auth-container">
        <div className="auth-form-container">
          <h1 className="auth-title">
            {step === 1 ? 'Tạo tài khoản mới' : 'Hoàn tất đăng ký'}
          </h1>

          <form className="auth-form" onSubmit={handleNextStep}>
            {step === 1 ? (
              // Step 1: Email
              <>
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

                <button
                  type="submit"
                  className="auth-button"
                  disabled={loading}
                >
                  {loading ? 'Đang xử lý...' : 'Tiếp theo'}
                </button>

                <div className="auth-separator">
                  <span>Hoặc</span>
                </div>

                <button
                  type="button"
                  className="google-button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  <img src="/assets/google-icon.svg" alt="Google" className="google-icon" />
                  Đăng ký với Google
                </button>
              </>
            ) : (
              // Step 2: Password, Subscription, Phone
              <>
                <div className="form-group">
                  <label htmlFor="password">Mật khẩu</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Tạo mật khẩu"
                    className={errors.password ? 'error' : ''}
                  />
                  {errors.password && <div className="error-message">{errors.password}</div>}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Nhập lại mật khẩu"
                    className={errors.confirmPassword ? 'error' : ''}
                  />
                  {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
                </div>

                <div className="form-group">
                  <label htmlFor="subscription_type">Gói dịch vụ</label>
                  <select
                    id="subscription_type"
                    name="subscription_type"
                    value={formData.subscription_type}
                    onChange={handleChange}
                  >
                    <option value={SUBSCRIPTION_TYPES.BASIC}>Cơ bản</option>
                    <option value={SUBSCRIPTION_TYPES.STANDARD}>Tiêu chuẩn</option>
                    <option value={SUBSCRIPTION_TYPES.PREMIUM}>Cao cấp</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Số điện thoại (tùy chọn)</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Nhập số điện thoại"
                    className={errors.phone ? 'error' : ''}
                  />
                  {errors.phone && <div className="error-message">{errors.phone}</div>}
                </div>

                <div className="form-buttons">
                  <button
                    type="button"
                    className="back-button"
                    onClick={() => setStep(1)}
                    disabled={loading}
                  >
                    Quay lại
                  </button>

                  <button
                    type="submit"
                    className="auth-button"
                    disabled={loading}
                  >
                    {loading ? 'Đang xử lý...' : 'Đăng ký'}
                  </button>
                </div>
              </>
            )}
          </form>

          <div className="auth-footer">
            Đã có tài khoản? <Link to="/login" className="auth-link">Đăng nhập</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register; 