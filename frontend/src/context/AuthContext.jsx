import { createContext, useContext, useEffect, useState } from 'react';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { loginWithFirebaseToken } from '../api/authApi';
import { showErrorToast } from '../utils/errorHandler';
import { USER_DATA_KEY, AUTH_TOKEN_KEY } from '../config/constants';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirebaseActive, setIsFirebaseActive] = useState(false);
  const [firebaseError, setFirebaseError] = useState(null);

  // Function để set user từ normal login
  const setUserFromNormalLogin = (userData) => {
    console.log('Setting user from normal login:', userData?.email);
    setUser(userData);
  };

  // Function để check localStorage và restore user state
  const checkLocalStorageForUser = () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const userData = localStorage.getItem(USER_DATA_KEY);
    
    if (token && userData) {
      try {
        const parsedUserData = JSON.parse(userData);
        console.log('Restored user from localStorage:', parsedUserData?.email);
        setUser(parsedUserData);
        return parsedUserData;
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        // Clear invalid data
        localStorage.removeItem(USER_DATA_KEY);
        localStorage.removeItem(AUTH_TOKEN_KEY);
      }
    }
    return null;
  };

  useEffect(() => {
    // Đầu tiên check localStorage cho normal login
    const localUser = checkLocalStorageForUser();
    
    // Check if Firebase is configured properly
    if (!auth) {
      console.warn('Firebase not configured properly. Running in development mode without Firebase.');
      setFirebaseError('Firebase not configured');
      setIsLoading(false);
      setIsFirebaseActive(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Firebase auth state changed:', firebaseUser);
      
      if (firebaseUser) {
        try {
          // Lấy ID token từ Firebase
          const idToken = await firebaseUser.getIdToken();
          
          // Gửi token đến backend để xác thực và tạo/lấy user
          const userData = await loginWithFirebaseToken(idToken);
          
          if (userData) {
            setUser(userData.user);
            console.log('User authenticated with backend:', userData.user.email);
          }
        } catch (error) {
          console.error('Error authenticating with backend:', error);
          showErrorToast('Có lỗi xảy ra khi đăng nhập');
          // Đăng xuất khỏi Firebase nếu backend authentication thất bại
          try {
            await signOut(auth);
          } catch (signOutError) {
            console.error('Error signing out:', signOutError);
          }
          setUser(null);
        }
      } else {
        // Nếu không có Firebase user, check localStorage
        if (!localUser) {
          setUser(null);
        }
      }
      
      setIsLoading(false);
      setIsFirebaseActive(true);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    if (firebaseError) {
      showErrorToast('Firebase chưa được cấu hình. Vui lòng kiểm tra environment variables.');
      return;
    }

    try {
      setIsLoading(true);
      const provider = new GoogleAuthProvider();
      // Thêm scopes để lấy thêm thông tin profile
      provider.addScope('profile');
      provider.addScope('email');
      
      const result = await signInWithPopup(auth, provider);
      console.log('Google sign in successful:', result.user.email);
      
      // Firebase auth state change sẽ tự động handle việc gửi token đến backend
      return result;
    } catch (error) {
      console.error('Google sign in error:', error);
      showErrorToast('Đăng nhập Google thất bại');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      
      if (auth && !firebaseError) {
        await signOut(auth);
      }
      
      setUser(null);
      // Xóa dữ liệu local storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      showErrorToast('Có lỗi xảy ra khi đăng xuất');
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    isFirebaseActive,
    isLoggedIn: !!user,
    firebaseError,
    loginWithGoogle,
    logout,
    setUserFromNormalLogin, // Thêm function này để normal login có thể update state
    checkLocalStorageForUser // Thêm function này để check localStorage
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 