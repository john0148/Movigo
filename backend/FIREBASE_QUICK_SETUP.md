# Firebase Quick Setup - Service Account Key

## 📋 Checklist Setup

### Step 1: Firebase Console Setup
- [ ] Tạo Firebase project tại [console.firebase.google.com](https://console.firebase.google.com)
- [ ] Enable Authentication > Sign-in method > Google
- [ ] Thêm web app và copy config

### Step 2: Download Service Account Key
1. Vào Firebase Console > ⚙️ Project Settings > Service Accounts
2. Click **"Generate new private key"**
3. Download file JSON
4. **Đổi tên thành `serviceAccountKey.json`**
5. **Copy vào thư mục `backend/serviceAccountKey.json`**

### Step 3: Frontend Configuration
Tạo file `frontend/.env`:
```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGE_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Step 4: Install Dependencies
```bash
# Frontend
cd frontend
npm install firebase

# Backend  
cd backend
pip install firebase-admin
```

### Step 5: Test Setup
```bash
# Terminal 1: Start Backend
cd backend
uvicorn app.main:app --reload

# Terminal 2: Start Frontend
cd frontend
npm run dev
```

## ✅ Verification

### Backend Logs
Nếu setup đúng, bạn sẽ thấy:
```
Firebase Admin SDK initialized successfully with service account key
```

### Frontend Test
1. Mở browser tại `http://localhost:5173`
2. Click "Đăng nhập với Google"
3. Chọn Google account
4. Should redirect to home page

## 🚨 Common Issues

### "Service account key not found"
```bash
# Check file location
ls backend/serviceAccountKey.json
```

### "Invalid Firebase ID token"
- Kiểm tra Firebase project ID trong .env
- Đảm bảo web app đã được add vào Firebase project

### "CORS error"
- Thêm `localhost:5173` vào Firebase Authorized domains
- Project Settings > Authentication > Authorized domains

## 📁 File Structure
```
backend/
├── serviceAccountKey.json  ✅ Firebase service account
├── .env                   ✅ Backend environment
└── app/

frontend/
├── .env                   ✅ Frontend environment  
└── src/
```

## 🔐 Security Reminder
- ❌ NEVER commit `serviceAccountKey.json`
- ❌ NEVER share service account key publicly
- ✅ File đã được add vào `.gitignore` 