# Colors for output
$Green = "Green"
$Blue = "Cyan"
$Red = "Red"
$Reset = "White"

function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $Reset
}

Write-ColorOutput $Blue "===== Movigo Database & Auto-Login Setup ====="

# Check if MongoDB is running (basic check)
Write-ColorOutput $Blue "Checking if MongoDB is running..."
$mongoRunning = Get-Process mongod -ErrorAction SilentlyContinue
if ($mongoRunning) {
    Write-ColorOutput $Green "MongoDB is running."
} else {
    Write-ColorOutput $Red "MongoDB is not running. Please start MongoDB first."
    Write-ColorOutput $Blue "Start MongoDB from Windows Services or run MongoDB executable"
    exit 1
}

# Navigate to backend directory
Write-ColorOutput $Blue "Navigating to backend directory..."
if (Test-Path "backend") {
    Set-Location -Path "backend"
} else {
    Write-ColorOutput $Red "Backend directory not found!"
    exit 1
}

# Create Python virtual environment if it doesn't exist
if (-Not (Test-Path "venv")) {
    Write-ColorOutput $Blue "Creating Python virtual environment..."
    try {
        python -m venv venv
    }
    catch {
        Write-ColorOutput $Red "Failed to create virtual environment: $_"
        exit 1
    }
}

# Activate virtual environment
Write-ColorOutput $Blue "Activating virtual environment..."
try {
    .\venv\Scripts\Activate.ps1
}
catch {
    Write-ColorOutput $Red "Failed to activate virtual environment: $_"
    exit 1
}

# Install required packages
Write-ColorOutput $Blue "Installing required packages..."
try {
    pip install pymongo bcrypt
}
catch {
    Write-ColorOutput $Red "Failed to install packages: $_"
    exit 1
}

# Generate fake data
Write-ColorOutput $Blue "Generating fake data..."
try {
    python generate_fake_data.py
}
catch {
    Write-ColorOutput $Red "Failed to generate fake data: $_"
    exit 1
}

# Check if credentials file was created
if (-Not (Test-Path "fake_user_credentials.json")) {
    Write-ColorOutput $Red "Credentials file was not created!"
    exit 1
}

# Get first user credentials
$credentialsJson = Get-Content "fake_user_credentials.json" | ConvertFrom-Json
$email = $credentialsJson[0].email
$password = $credentialsJson[0].password

# Create .env file for frontend
Write-ColorOutput $Blue "Creating .env file for frontend..."
Set-Location ..
if (-Not (Test-Path "frontend")) {
    Write-ColorOutput $Red "Frontend directory not found!"
    exit 1
}

Set-Location -Path "frontend"

@"
# API URL
VITE_API_URL=http://localhost:8000/api/v1

# Auto-login configuration
VITE_AUTO_LOGIN_EMAIL=$email
VITE_AUTO_LOGIN_PASSWORD=$password
VITE_ENABLE_AUTO_LOGIN=true
"@ | Out-File -FilePath ".env" -Encoding utf8

Write-ColorOutput $Green "Setup complete!"
Write-ColorOutput $Green "Auto-login configured with:"
Write-Output "Email: $email"
Write-Output "Password: $password"
Write-Output ""
Write-ColorOutput $Blue "Start your backend server with:"
Write-Output "cd backend; uvicorn app.main:app --reload"
Write-ColorOutput $Blue "Start your frontend with:"
Write-Output "cd frontend; npm run dev"

# Deactivate virtual environment
deactivate 