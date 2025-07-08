import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * AdminProtectedRoute Component
 * Bảo vệ các route chỉ dành cho admin
 * - Kiểm tra user đã đăng nhập
 * - Kiểm tra user có role admin
 * - Redirect về login nếu chưa đăng nhập
 * - Redirect về home nếu không phải admin
 */
const AdminProtectedRoute = ({ children }) => {
    const { user, isLoggedIn, isLoading } = useAuth();

    // Hiển thị loading nếu đang kiểm tra auth
    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '18px'
            }}>
                Đang kiểm tra quyền truy cập...
            </div>
        );
    }

    // Redirect về login nếu chưa đăng nhập
    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    // Kiểm tra role admin
    console.log('Admin Route Check:', {
        user: user,
        role: user?.role,
        isAdmin: user?.role === 'admin'
    });

    // Redirect về home nếu không phải admin
    if (user?.role !== 'admin') {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '18px',
                color: '#dc3545'
            }}>
                <h2>⛔ Không có quyền truy cập</h2>
                <p>Bạn cần có quyền admin để truy cập trang này.</p>
                <p>Role hiện tại: {user?.role || 'user'}</p>
                <button
                    onClick={() => window.location.href = '/'}
                    style={{
                        padding: '10px 20px',
                        marginTop: '20px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                    }}
                >
                    Về trang chủ
                </button>
            </div>
        );
    }

    // Render children nếu là admin
    return children;
};

export default AdminProtectedRoute; 