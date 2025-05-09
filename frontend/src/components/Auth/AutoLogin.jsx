import { useState, useEffect, useRef } from 'react';
import { autoLoginWithDemoUser, autoLoginWithFixedCredentials } from '../../api/demoApi';
import { AUTH_TOKEN_KEY, USER_DATA_KEY } from '../../config/constants';
import { AUTO_LOGIN_CONFIG } from '../../config/autoLogin';

/**
 * AutoLogin Component
 * 
 * This component automatically logs in with a fixed user from the database when mounted.
 * It is used in development to bypass the login process.
 */
const AutoLogin = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [logInfo, setLogInfo] = useState('Đang khởi tạo đăng nhập tự động...');
    const loginAttemptRef = useRef(false);

    useEffect(() => {
        const performAutoLogin = async () => {
            // Prevent double login attempts
            if (loginAttemptRef.current) return;
            loginAttemptRef.current = true;

            try {
                setError(null);

                // Check if already logged in
                const token = localStorage.getItem(AUTH_TOKEN_KEY);
                const userData = localStorage.getItem(USER_DATA_KEY);
                if (token && userData) {
                    console.log('Already logged in, skipping auto-login');
                    setLogInfo('Đã đăng nhập trước đó, bỏ qua đăng nhập tự động');
                    setIsLoading(false);
                    return;
                }

                console.log('Starting auto-login process...');
                setLogInfo('Bắt đầu quá trình đăng nhập tự động...');

                // Attempt login with fixed credentials from autoLogin.js
                let authData = null;
                if (AUTO_LOGIN_CONFIG.enabled) {
                    console.log('Using fixed credentials for auto-login');
                    setLogInfo(`Đang đăng nhập với tài khoản cố định: ${AUTO_LOGIN_CONFIG.email}`);
                    authData = await autoLoginWithFixedCredentials(); // This calls /auth/login/json
                }

                // REMOVED FALLBACK: Do not attempt demo user login if fixed credentials fail.
                // The goal is to log in with the configured user or fail.
                // if (!authData) {
                //     console.warn('Fixed credentials failed or disabled, trying demo user...');
                //     setLogInfo('Tài khoản cố định thất bại, đang thử với tài khoản demo...');
                //     authData = await autoLoginWithDemoUser(true); 
                // }

                if (!authData) {
                    // This now means the primary attempt failed
                    console.error('Auto-login with fixed credentials failed.');
                    setError('Đăng nhập tự động với tài khoản cố định thất bại.');
                    setLogInfo('Đăng nhập tự động thất bại.');
                } else {
                    // This means autoLoginWithFixedCredentials succeeded
                    const user = JSON.parse(localStorage.getItem(USER_DATA_KEY));
                    const email = user?.email || 'Unknown user';
                    const plan = user?.subscription_plan || 'unknown plan';
                    console.log(`Successfully logged in via fixed credentials as: ${email} with plan: ${plan}`);
                    setLogInfo(`Đăng nhập tự động thành công với tài khoản: ${email} (${plan})`);
                }
            } catch (err) { // Catch errors from the login functions themselves
                console.error('Error during performAutoLogin:', err);
                setError(err.message || 'Auto-login failed');
                setLogInfo('Lỗi trong quá trình đăng nhập tự động');
            } finally {
                console.log('Auto-login finally block reached, setting isLoading to false.');
                setIsLoading(false);
            }
        };

        performAutoLogin();
    }, []);

    // MODIFICATION: Render children immediately, regardless of isLoading state.
    // The loading indicator can be shown conditionally elsewhere if needed,
    // or we can add a small loading message overlay here.

    // Optional: Show a minimal loading/status message overlay while loading
    // if (isLoading) {
    //     return (
    //         <>
    //             <div style={{ position: 'fixed', top: 0, left: 0, padding: '10px', background: 'rgba(0,0,0,0.7)', color: 'white', zIndex: 9999 }}>
    //                 {logInfo}
    //             </div>
    //             {children} 
    //         </>
    //     );
    // }

    // Render children right away
    return children;
};

export default AutoLogin; 