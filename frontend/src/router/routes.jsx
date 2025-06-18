import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import Home from '../pages/Home';
import MovieDetail from '../pages/MovieDetail';
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import ProfileMain from '../pages/Profile/ProfileMain';
import WatchHistory from '../pages/Profile/WatchHistory';
import WatchLater from '../pages/Profile/WatchLater';
import VipRegister from '../pages/Profile/VipRegister';
import ProtectedRoute from './ProtectedRoute';
import MoviePlayer from '../pages/MoviePlayer';
import NotFound from '../pages/NotFound';
import Search from '../pages/Search';

/**
 * App Routes Configuration
 * Cấu hình định tuyến cho ứng dụng, bao gồm:
 * - Trang chính hiển thị danh sách phim
 * - Trang chi tiết phim
 * - Trang xem phim
 * - Trang đăng nhập/đăng ký
 * - Các trang quản lý profile (được bảo vệ, yêu cầu đăng nhập)
 */
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'movies/:id', element: <MovieDetail /> },
      { path: 'watch/:id', element: <MoviePlayer /> },
      { path: 'search', element: <Search /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      {
        path: 'profile',
        element: <ProtectedRoute><ProfileMain /></ProtectedRoute>
      },
      {
        path: 'profileMain',
        element: <ProtectedRoute><ProfileMain /></ProtectedRoute>
      },
      {
        path: 'profile/history',
        element: <ProtectedRoute><WatchHistory /></ProtectedRoute>
      },
      {
        path: 'profile/watchlater',
        element: <ProtectedRoute><WatchLater /></ProtectedRoute>
      },
      {
        path: 'profile/vip',
        element: <ProtectedRoute><VipRegister /></ProtectedRoute>
      },
      { path: '*', element: <NotFound /> }
    ]
  }
]);

export default router;