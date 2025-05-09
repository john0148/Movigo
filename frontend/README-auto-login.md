# Auto-Login Configuration for Movigo Frontend

## Overview
This document explains how to set up and use automatic login for the Movigo frontend application during development. This feature allows developers to bypass the login screen and automatically authenticate with predefined user credentials.

## Setup Instructions

### 1. Generate Fake User Data
First, you need to generate fake user data including credentials that will be used for auto-login:

```bash
# Navigate to the backend directory
cd backend

# Install required packages
pip install pymongo bcrypt

# Run the data generation script
python generate_fake_data.py
```

This will:
- Create fake users, movies, and watch history in your MongoDB database
- Save user credentials to `fake_user_credentials.json` for reference
- Display auto-login configuration settings in the console

### 2. Create .env File
Create a `.env` file in the frontend directory with the following content:

```
# API URL
VITE_API_URL=http://localhost:8000/api/v1

# Auto-login configuration
VITE_AUTO_LOGIN_EMAIL=admin@movigo.com
VITE_AUTO_LOGIN_PASSWORD=admin123
VITE_ENABLE_AUTO_LOGIN=true
```

You can use any credentials from the generated `fake_user_credentials.json` file.

### 3. Start the Frontend Application
Start the frontend application and it will automatically log in with the configured credentials:

```bash
cd frontend
npm run dev
```

## How It Works
The auto-login feature works as follows:

1. When the application starts, it checks if auto-login is enabled in the environment variables
2. If enabled, it attempts to log in using the provided credentials
3. On successful login, it redirects to the home page with the user automatically logged in

## Available Accounts
The data generation script creates the following types of accounts:

1. **Admin User**:
   - Email: admin@movigo.com
   - Password: admin123
   - Role: admin
   - Subscription: premium

2. **Regular Users** (first 3 are saved for easy access):
   - Email: user0@example.com
   - Password: user0pass
   - Role: user
   - Subscription: random (free/basic/standard/premium)

   ... plus more regular users with incrementing numbers

## Disabling Auto-Login
To disable auto-login, set `VITE_ENABLE_AUTO_LOGIN=false` in your `.env` file or remove the variable entirely.

## Security Notice
Auto-login is intended for development purposes only. Never use this feature in production environments or with real user credentials.

## Troubleshooting

### Auto-login not working
1. Make sure the backend server is running
2. Check MongoDB connection settings in the backend
3. Verify that the user credentials in `.env` match a user in the database
4. Check the browser console for error messages

### "User not found" error
Run the `generate_fake_data.py` script again to populate the database with fresh user data.

### Authentication token issues
Clear your browser localStorage and refresh the page to reset the authentication state. 