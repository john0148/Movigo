# Firebase Google Authentication Setup Guide

## Cài đặt Firebase cho Movigo

### 1. Frontend Setup

#### Cài đặt Firebase SDK
```bash
cd frontend
npm install firebase
```

#### Cấu hình Firebase (.env file)
Tạo file `.env` trong thư mục `frontend/` với nội dung:

```env
# API Configuration
VITE_API_URL=http://localhost:8000/api/v1

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGE_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 2. Backend Setup

#### Cài đặt Firebase Admin SDK
```bash
cd backend
pip install firebase-admin>=6.0.0
```

#### Service Account Key (Bắt buộc)
1. Vào Firebase Console > Project Settings > Service Accounts
2. Click "Generate new private key" và tải file JSON
3. **Đổi tên file thành `serviceAccountKey.json`**
4. **Đặt file vào thư mục `backend/serviceAccountKey.json`**

**Cấu trúc thư mục:**
```
backend/
├── app/
├── serviceAccountKey.json  ← Đặt file ở đây
├── requirements.txt
└── ...
```

**Lưu ý bảo mật:**
- File `serviceAccountKey.json` đã được thêm vào `.gitignore`
- KHÔNG commit file này lên git
- Chỉ share file này qua các kênh bảo mật

### 3. Firebase Console Setup

#### Tạo Firebase Project
1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Tạo project mới hoặc chọn project existing
3. Enable Authentication > Sign-in method > Google

#### Cấu hình Authorized Domains
- Thêm `localhost` và domain production vào Authorized domains

#### Web App Configuration
1. Project Settings > General > Your apps
2. Add app > Web
3. Copy config object để dùng trong `.env`

### 4. Google Cloud Console (cho Production)

#### Service Account
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. IAM & Admin > Service Accounts
3. Tạo service account với role "Firebase Authentication Admin"
4. Tạo key và download JSON file

### 5. Testing

#### Kiểm tra Frontend
```bash
cd frontend
npm run dev
```

#### Kiểm tra Backend
```bash
cd backend
uvicorn app.main:app --reload
```

### 6. Troubleshooting

#### Common Issues:

1. **"Firebase Admin SDK initialization failed"**
   - Kiểm tra service account key
   - Kiểm tra permissions của file
   - Đảm bảo PROJECT_ID đúng

2. **"Invalid Firebase ID token"**
   - Kiểm tra clock sync
   - Kiểm tra token expiry
   - Kiểm tra project configuration

3. **CORS errors**
   - Thêm domain vào Firebase Authorized domains
   - Kiểm tra CORS settings trong backend

### 7. Security Notes

- **KHÔNG** commit service account keys vào git
- Sử dụng environment variables cho production
- Limit scopes cho service accounts
- Rotate keys định kỳ

### 8. Production Deployment

#### Using Google Cloud
```bash
# Set environment variable thay vì service account file
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"
```

#### Using Docker
```dockerfile
# Copy service account key
COPY serviceAccountKey.json /app/
ENV GOOGLE_APPLICATION_CREDENTIALS=/app/serviceAccountKey.json
``` 