import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { login } from '../services/authService';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [usingFallbackData, setUsingFallbackData] = useState(false);

    const navigate = useNavigate();
    const { refreshUserFromStorage } = useOutletContext() || {};

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        setUsingFallbackData(false);

        try {
            const authData = await login({
                email,
                password,
                remember_me: rememberMe
            });

            console.log('Login response:', authData);

            // Kiểm tra xem đang sử dụng dữ liệu fallback hay không
            if (authData.access_token && authData.access_token.startsWith('mock-token')) {
                console.log('Using fallback authentication data');
                setUsingFallbackData(true);
            }

            // Buộc App component cập nhật user state từ localStorage
            if (refreshUserFromStorage) {
                refreshUserFromStorage();
            }

            // Chuyển đến trang chủ sau khi đăng nhập thành công
            navigate('/');
        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-overlay"></div>
            <header className="auth-header">
                <Link to="/" className="auth-logo">MOVIGO</Link>
            </header>

            <div className="auth-container">
                <div className="auth-form-container">
                    <h1 className="auth-title">Đăng nhập</h1>

                    {error && (
                        <div className="error-message">
                            <span className="error-icon">⚠️</span> {error}
                        </div>
                    )}

                    <form className="auth-form" onSubmit={handleSubmit}>
                        {/* ... existing form code ... */}
                    </form>

                    {/* ... existing code ... */}
                </div>
            </div>
        </div>
    );
};

export default Login; 