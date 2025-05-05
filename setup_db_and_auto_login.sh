#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Movigo Database & Auto-Login Setup =====${NC}"

# Check if MongoDB is running
echo -e "${BLUE}Checking if MongoDB is running...${NC}"
if pgrep -x "mongod" > /dev/null
then
    echo -e "${GREEN}MongoDB is running.${NC}"
else
    echo -e "${RED}MongoDB is not running. Please start MongoDB first.${NC}"
    echo -e "Run: ${BLUE}mongod${NC} or ${BLUE}sudo service mongod start${NC}"
    exit 1
fi

# Navigate to backend directory
echo -e "${BLUE}Navigating to backend directory...${NC}"
cd backend || { echo -e "${RED}Backend directory not found!${NC}"; exit 1; }

# Create Python virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo -e "${BLUE}Creating Python virtual environment...${NC}"
    python -m venv venv || python3 -m venv venv
fi

# Activate virtual environment
echo -e "${BLUE}Activating virtual environment...${NC}"
source venv/bin/activate || { echo -e "${RED}Failed to activate virtual environment!${NC}"; exit 1; }

# Install required packages
echo -e "${BLUE}Installing required packages...${NC}"
pip install pymongo bcrypt || { echo -e "${RED}Failed to install packages!${NC}"; exit 1; }

# Generate fake data
echo -e "${BLUE}Generating fake data...${NC}"
python generate_fake_data.py || { echo -e "${RED}Failed to generate fake data!${NC}"; exit 1; }

# Check if credentials file was created
if [ ! -f "fake_user_credentials.json" ]; then
    echo -e "${RED}Credentials file was not created!${NC}"
    exit 1
fi

# Get first user credentials
EMAIL=$(grep -o '"email": "[^"]*"' fake_user_credentials.json | head -1 | cut -d'"' -f4)
PASSWORD=$(grep -o '"password": "[^"]*"' fake_user_credentials.json | head -1 | cut -d'"' -f4)

# Create .env file for frontend
echo -e "${BLUE}Creating .env file for frontend...${NC}"
cd ../frontend || { echo -e "${RED}Frontend directory not found!${NC}"; exit 1; }

cat > .env << EOF
# API URL
VITE_API_URL=http://localhost:8000/api/v1

# Auto-login configuration
VITE_AUTO_LOGIN_EMAIL=$EMAIL
VITE_AUTO_LOGIN_PASSWORD=$PASSWORD
VITE_ENABLE_AUTO_LOGIN=true
EOF

echo -e "${GREEN}Setup complete!${NC}"
echo -e "${GREEN}Auto-login configured with:${NC}"
echo -e "Email: ${BLUE}$EMAIL${NC}"
echo -e "Password: ${BLUE}$PASSWORD${NC}"
echo -e "\n${BLUE}Start your backend server with:${NC}"
echo -e "cd backend && uvicorn app.main:app --reload"
echo -e "\n${BLUE}Start your frontend with:${NC}"
echo -e "cd frontend && npm run dev" 