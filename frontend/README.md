# Movigo Frontend

## Overview
Movigo is a Netflix-inspired movie streaming platform built with React and modern web technologies. This frontend application provides a responsive and engaging user interface for browsing movies, watching content, and managing user profiles.

## Features
- 🎬 Browse movies by category, genre, and popularity
- 👤 User authentication and profile management
- 📊 Watch history and statistics
- 🔍 Search functionality with filters
- 📱 Responsive design for all devices
- 🌙 Dark mode (Netflix-inspired theme)

## Tech Stack
- **React** - UI library
- **React Router** - Navigation
- **Axios** - API client
- **Chart.js** - Data visualization for watch statistics
- **CSS Modules** - Component styling

## Project Structure
```
frontend/
├── public/             # Static assets
│   ├── assets/         # Images and other assets
│   └── index.html      # HTML template
├── src/
│   ├── api/            # API client functions
│   ├── components/     # React components
│   │   ├── Auth/       # Authentication components
│   │   ├── MovieList/  # Movie list components
│   │   └── Profile/    # Profile components
│   ├── config/         # Configuration files
│   ├── pages/          # Page components
│   ├── styles/         # CSS files
│   ├── utils/          # Utility functions
│   ├── App.jsx         # Main App component
│   └── main.jsx        # Application entry point
├── .env                # Environment variables (not in repo)
├── .env.example        # Example environment variables
├── package.json        # Dependencies and scripts
└── README.md           # This documentation
```

## Component Organization
The application uses a shared component architecture to minimize code duplication:

### Key Shared Components
- **MovieItem** - Reusable movie card component used in both grid and list views
- **LoadingSpinner** - Consistent loading indicator
- **FeaturedBanner** - Hero banner for featured content

### Feature-specific Components
- **Auth** - Login, Register, and authentication-related components
- **MovieList** - Various movie list display components
- **Profile** - User profile and statistics components

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation
1. Clone the repository
2. Install dependencies:
   ```
   cd frontend
   npm install
   ```
3. Create a `.env` file based on `.env.example`
4. Start the development server:
   ```
   npm run dev
   ```

### Environment Variables
Key environment variables include:
- `VITE_API_URL`: URL to the backend API

## Development Guidelines

### Adding New Components
1. Create component files in the appropriate directory
2. Use the shared components whenever possible
3. Keep styling in separate CSS files
4. Follow the established naming conventions

### Code Style
- Use functional components with hooks
- Follow proper file structure and naming conventions
- Use constants for fixed values
- Document complex logic with comments

## Build and Deployment
Build the application for production:
```
npm run build
```

The build artifacts will be stored in the `dist/` directory, ready to be deployed.

## Available Scripts
- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint for code quality checks

## Browser Support
The application is tested and supported on the following browsers:
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest version)

## Contributing
Please read our contributing guidelines before submitting pull requests.

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Đăng nhập và Xác thực

### Xác thực với MongoDB

Hệ thống ưu tiên xác thực người dùng thông qua MongoDB. Khi đăng nhập, hệ thống sẽ:

1. Gửi request đến API backend để xác thực
2. Nếu thành công, lấy dữ liệu người dùng từ MongoDB (bao gồm subscription_plan)
3. Lưu thông tin người dùng vào localStorage
4. Hiển thị các tính năng phù hợp với gói subscription_plan của người dùng

Các cấp độ subscription_plan:
- `basic`: Gói cơ bản, hiển thị màu xanh
- `standard`: Gói tiêu chuẩn, hiển thị màu vàng
- `premium`: Gói cao cấp, hiển thị màu đỏ

### Xử lý khi không thể kết nối MongoDB

Khi không thể kết nối đến MongoDB, ứng dụng sẽ:

1. Hiển thị thông báo cảnh báo: "Không thể kết nối đến MongoDB. Đang sử dụng dữ liệu cục bộ."
2. Hiển thị hai lựa chọn:
   - **Thử kết nối lại**: Kiểm tra lại kết nối MongoDB thông qua API `/mongodb-status` và thử đăng nhập lại nếu kết nối thành công
   - **Tiếp tục với dữ liệu cục bộ**: Sử dụng dữ liệu fallback và tiếp tục vào ứng dụng

Nếu người dùng chọn tiếp tục với dữ liệu cục bộ, hệ thống sẽ:
1. Chuyển hướng đến trang chủ
2. Sử dụng dữ liệu người dùng từ bộ nhớ cục bộ (không lưu vào MongoDB)
3. Hiển thị cảnh báo rằng các tính năng yêu cầu database có thể không hoạt động

### Xác thực Fallback

Trong trường hợp không thể kết nối đến MongoDB, hệ thống sẽ sử dụng dữ liệu mặc định:

1. Kiểm tra và sử dụng tài khoản từ danh sách cứng nếu email trùng khớp
   - admin@movigo.com (premium)
   - user0@example.com (basic)
   - user1@example.com (premium)
   - user2@example.com (standard)
2. Nếu không có trong danh sách, tạo tài khoản generic với subscription_plan là "basic"

**LƯU Ý:** Khi sử dụng tài khoản đã có trong MongoDB (ví dụ: user9@example.com với subscription_plan là "standard"), đảm bảo MongoDB đang hoạt động để hệ thống có thể đọc đúng thông tin subscription_plan.

### Khắc phục lỗi kết nối MongoDB

Nếu gặp lỗi kết nối MongoDB, hãy kiểm tra:

1. MongoDB đã được cài đặt và đang chạy
2. URI kết nối MongoDB trong file `.env` hoặc biến môi trường `MONGODB_URL` đã chính xác
3. Firewall hoặc network settings không chặn kết nối đến MongoDB
4. MongoDB đang chạy trên port mặc định (27017)

Backend endpoint `/api/v1/mongodb-status` có thể được sử dụng để kiểm tra và debug kết nối MongoDB.
