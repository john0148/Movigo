# MongoDB Setup for Movigo

## Cài đặt MongoDB

1. Tải và cài đặt MongoDB từ [trang chủ MongoDB](https://www.mongodb.com/try/download/community)
2. Đảm bảo MongoDB đang chạy trên máy của bạn (mặc định port 27017)

## Thiết lập cấu hình cho backend

1. Tạo file `.env` trong thư mục `backend/` (có thể sao chép từ `.env.example` nếu có)
2. Cấu hình các biến môi trường sau:

```
MONGODB_URL=mongodb://localhost:27017
MONGODB_NAME=movigo
SECRET_KEY=your_secret_key
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

## Tạo User trong MongoDB

Hệ thống cung cấp script `create_user.py` để dễ dàng tạo người dùng. Để sử dụng:

1. Đảm bảo MongoDB đang chạy
2. Chạy script với lệnh:

```bash
python backend/create_user.py
```

3. Làm theo hướng dẫn để tạo người dùng:
   - Nhập email (ví dụ: admin@movigo.com nếu muốn đúng với cấu hình auto-login)
   - Nhập mật khẩu (ví dụ: admin123 nếu muốn đúng với cấu hình auto-login)
   - Nhập thông tin người dùng khác
   - Chọn vai trò (user hoặc admin)
   - Chọn gói đăng ký (free, basic, standard, premium)

## Kiểm tra kết nối MongoDB

Để kiểm tra kết nối MongoDB đã hoạt động hay chưa:

1. Khởi động server backend:

```bash
cd backend
uvicorn app.main:app --reload
```

2. Truy cập endpoint kiểm tra MongoDB: http://localhost:8000/api/v1/mongodb-status

## Sử dụng Auto-Login

Để sử dụng tính năng auto-login:

1. Chỉnh sửa file `frontend/src/config/autoLogin.js` để khớp với thông tin tài khoản đã tạo.
2. Đảm bảo `enabled: true` để kích hoạt auto-login.
3. Khởi động frontend:

```bash
cd frontend
npm run dev
```

## Gói Đăng Ký và Màu Sắc

Hệ thống hỗ trợ 4 loại gói đăng ký, mỗi loại được hiển thị với một màu khác nhau:

- **free**: Gói miễn phí - màu trắng
- **basic**: Gói cơ bản - màu xanh
- **standard**: Gói tiêu chuẩn - màu vàng
- **premium**: Gói cao cấp - màu đỏ

## Xử lý Lỗi Phổ biến

1. **Lỗi kết nối MongoDB**:
   - Kiểm tra MongoDB đã được cài đặt và đang chạy
   - Kiểm tra URL trong file `.env` đã chính xác chưa
   - Kiểm tra firewall không chặn port 27017

2. **Lỗi đăng nhập**:
   - Kiểm tra tài khoản trong MongoDB (chạy `create_user.py` để tạo nếu chưa có)
   - Kiểm tra thông tin trong `autoLogin.js` đã khớp với tài khoản trong MongoDB chưa 