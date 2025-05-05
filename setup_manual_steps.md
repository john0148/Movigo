# Movigo Manual Setup Steps (PowerShell)

If you're having trouble with the PowerShell script, you can follow these manual steps to set up the database and auto-login feature.

## Prerequisites
- MongoDB installed and running
- Python 3.7+ installed
- Node.js and npm installed

## Step 1: Generate Fake Data

Copy and paste these commands into PowerShell:

```powershell
# Navigate to backend directory
cd backend

# Create virtual environment (if not exists)
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install required packages
pip install pymongo bcrypt

# Generate fake data
python generate_fake_data.py

# Check the results
Get-Content fake_user_credentials.json
```

## Step 2: Create .env File for Frontend

Copy the first user's email and password from the output, then:

```powershell
# Navigate to frontend directory
cd ..\frontend

# Create .env file (replace with your user credentials)
@"
# API URL
VITE_API_URL=http://localhost:8000/api/v1

# Auto-login configuration
VITE_AUTO_LOGIN_EMAIL=admin@movigo.com
VITE_AUTO_LOGIN_PASSWORD=admin123
VITE_ENABLE_AUTO_LOGIN=true
"@ | Out-File -FilePath ".env" -Encoding utf8
```

## Step 3: Start the Applications

### Start the Backend
In a PowerShell window:
```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

### Start the Frontend
In another PowerShell window:
```powershell
cd frontend
npm run dev
```

## User Credentials

The generated user credentials will be saved in `backend/fake_user_credentials.json`. By default:

- Admin user:
  - Email: admin@movigo.com
  - Password: admin123

- Regular users:
  - Email: user0@example.com
  - Password: user0pass
  - (and more) 