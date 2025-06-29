import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../../api/authApi';
import GoogleAuth from './GoogleAuth';
import '../styles/Auth.css';

/**
 * RegisterForm Component
 * Hiển thị form đăng ký với email, mật khẩu, số điện thoại và lựa chọn gói dịch vụ
 */
const RegisterForm = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    plan: 'basic', // basic, standard, premium
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

  const validateStep1 = () => {
    if (!formData.email) {
      setError('Vui lòng nhập email');
      return false;
    }

    if (!formData.password) {
      setError('Vui lòng nhập mật khẩu');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    if (!formData.phone) {
      setError('Vui lòng nhập số điện thoại');
      return false;
    }

    // Kiểm tra định dạng số điện thoại Việt Nam
    const phoneRegex = /^(0|\+84)(\d{9,10})$/;
    if (!phoneRegex.test(formData.phone)) {
      setError('Số điện thoại không hợp lệ');
      return false;
    }

    return true;
  };

  const goToNextStep = () => {
    setError('');

    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const goBack = () => {
    setError('');
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setIsLoading(true);

      // Map plan to subscription_type cho backend
      const submitData = {
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        subscription_type: formData.plan // Map plan -> subscription_type
      };

      await register(submitData);

      // Hiển thị thông báo thành công ngay lập tức
      alert('🎉 Đăng ký thành công!\n\nBạn sẽ được chuyển đến trang đăng nhập.');

      // Chuyển đến trang login với thông báo
      navigate('/login', {
        state: { message: '✅ Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.' }
      });
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.detail || 'Đăng ký không thành công');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      <h2>Đăng ký tài khoản</h2>

      {error && <div className="auth-error">{error}</div>}

      <div className="register-steps">
        <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
        <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
        <div className={`step ${step >= 3 ? 'active' : ''}`}>3</div>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        {step === 1 && (
          <>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Nhập email của bạn"
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
              />
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
              />
            </div>

            <button type="button" className="auth-button" onClick={goToNextStep}>
              Tiếp theo
            </button>

            <div className="auth-divider">
              <span>hoặc</span>
            </div>

            <GoogleAuth isRegister />
          </>
        )}

        {step === 2 && (
          <>
            <div className="form-group">
              <label htmlFor="phone">Số điện thoại</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Nhập số điện thoại của bạn"
              />
            </div>

            <div className="form-actions">
              <button type="button" className="auth-button secondary" onClick={goBack}>
                Quay lại
              </button>
              <button type="button" className="auth-button" onClick={goToNextStep}>
                Tiếp theo
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h3>Chọn gói dịch vụ</h3>

            <div className="plan-options">
              <div
                className={`plan-option ${formData.plan === 'basic' ? 'selected' : ''}`}
                onClick={() => handleChange({ target: { name: 'plan', value: 'basic' } })}
              >
                <h4>Cơ bản</h4>
                <p>Xem trên 1 thiết bị, SD</p>
                <p className="plan-price">79.000đ/tháng</p>
              </div>

              <div
                className={`plan-option ${formData.plan === 'standard' ? 'selected' : ''}`}
                onClick={() => handleChange({ target: { name: 'plan', value: 'standard' } })}
              >
                <h4>Tiêu chuẩn</h4>
                <p>Xem trên 2 thiết bị, HD</p>
                <p className="plan-price">179.000đ/tháng</p>
              </div>

              <div
                className={`plan-option ${formData.plan === 'premium' ? 'selected' : ''}`}
                onClick={() => handleChange({ target: { name: 'plan', value: 'premium' } })}
              >
                <h4>Cao cấp</h4>
                <p>Xem trên 4 thiết bị, 4K+HDR</p>
                <p className="plan-price">259.000đ/tháng</p>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="auth-button secondary" onClick={goBack}>
                Quay lại
              </button>
              <button type="submit" className="auth-button" disabled={isLoading}>
                {isLoading ? 'Đang đăng ký...' : 'Hoàn tất đăng ký'}
              </button>
            </div>
          </>
        )}
      </form>

      <div className="auth-links">
        <a href="/login">Đã có tài khoản? Đăng nhập</a>
      </div>
    </div>
  );
};

export default RegisterForm; 