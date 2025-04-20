import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { googleAuth } from '../../api/authApi';
import '../styles/Auth.css';

/**
 * GoogleAuth Component
 * Xử lý đăng nhập/đăng ký bằng Google OAuth
 * Props:
 * - isRegister: Boolean xác định nếu component được sử dụng trong context đăng ký
 */
const GoogleAuth = ({ isRegister = false }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Load the Google API script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      // Clean up
      document.body.removeChild(script);
    };
  }, []);

  const handleGoogleResponse = async (response) => {
    try {
      const result = await googleAuth(response.credential);
      
      // Lưu token vào localStorage
      localStorage.setItem('token', result.access_token);
      
      // Redirect to homepage
      navigate('/');
    } catch (error) {
      console.error('Google auth error:', error);
    }
  };

  useEffect(() => {
    // Initialize Google Sign-In when the component mounts
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });

      window.google.accounts.id.renderButton(
        document.getElementById('google-signin-button'),
        { 
          theme: 'filled_blue', 
          size: 'large',
          text: isRegister ? 'signup_with' : 'signin_with',
          width: 280 
        }
      );
    }
  }, [window.google, isRegister]);

  return (
    <div className="google-auth">
      <div id="google-signin-button"></div>
      {!window.google && (
        <button className="google-button-fallback">
          {isRegister ? 'Đăng ký' : 'Đăng nhập'} với Google
        </button>
      )}
    </div>
  );
};

export default GoogleAuth; 