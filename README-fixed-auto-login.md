# Movigo Fixed Auto-Login Feature

This feature allows automatic login with a specific fixed user account in MongoDB. It's designed for development and testing purposes to provide a consistent login experience.

## How It Works

1. A fixed user account is created in MongoDB with known credentials
2. The frontend auto-login feature first tries to log in with these fixed credentials
3. If that fails, it falls back to the existing demo user functionality

## Setup Instructions

### 1. Create the Fixed User in MongoDB

Run the provided script to create a fixed user:

```bash
# Navigate to backend directory
cd backend

# Run the script to create a fixed user
python scripts/create_fixed_user.py

# Optional: Customize email and password
python scripts/create_fixed_user.py --email custom@example.com --password custompass123
```

### 2. Verify Configuration

The auto-login configuration is stored in `frontend/src/config/autoLogin.js`. Make sure the credentials match what you created:

```javascript
export const AUTO_LOGIN_CONFIG = {
  enabled: true,
  email: "movigo@example.com", // Should match what you created
  password: "movigo123"        // Should match what you created
};
```

### 3. Test Auto-Login

1. Start the backend server:
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

2. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

3. The application should automatically log in with your fixed user credentials

## Important Security Note

This feature is for development and testing only. For production:

1. Disable auto-login by setting `enabled: false` in the config
2. Remove or secure the `/api/v1/demo` endpoints in the backend
3. Remove the fixed user from the database

## Troubleshooting

If auto-login fails:

1. Check MongoDB connection and make sure the database is running
2. Verify the user exists in the database with the correct email and password
3. Ensure the backend API is running and accessible
4. Check browser console for specific error messages

## Falling Back to Demo User

If auto-login with fixed credentials fails, the system will automatically try to use a random or default demo user as before. This provides a reliable fallback mechanism. 