#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Setting up Movigo Auto-Login Feature ===${NC}"

# Check MongoDB is running
echo -e "${YELLOW}Checking MongoDB connection...${NC}"
if ! command -v mongosh &> /dev/null; then
    echo -e "${RED}MongoDB CLI tools not found. Please install MongoDB.${NC}"
    echo "You can still proceed but make sure MongoDB is running."
else
    # Simple check using MongoDB CLI
    if ! mongosh --eval "db.version()" --quiet > /dev/null 2>&1; then
        echo -e "${RED}MongoDB is not running. Please start MongoDB first.${NC}"
        exit 1
    else
        echo -e "${GREEN}MongoDB is running.${NC}"
    fi
fi

# Navigate to backend directory and create fixed user
echo -e "${YELLOW}Creating fixed user in MongoDB...${NC}"
cd backend || { echo -e "${RED}Backend directory not found!${NC}"; exit 1; }

# Check if Python is available
if ! command -v python &> /dev/null; then
    echo -e "${RED}Python not found. Please install Python.${NC}"
    exit 1
fi

# Create the fixed user
echo -e "${YELLOW}Running fixed user creation script...${NC}"
python scripts/create_fixed_user.py
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to create fixed user.${NC}"
    exit 1
fi

# Return to root directory
cd ..

# Verify frontend config
echo -e "${YELLOW}Verifying frontend configuration...${NC}"
if [ ! -f "frontend/src/config/autoLogin.js" ]; then
    echo -e "${RED}Auto-login configuration file not found!${NC}"
    exit 1
else
    echo -e "${GREEN}Auto-login configuration file exists.${NC}"
fi

echo -e "${GREEN}=== Setup Complete! ===${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Start the backend server: cd backend && uvicorn app.main:app --reload"
echo "2. Start the frontend server: cd frontend && npm run dev"
echo "3. The application should automatically log in with the fixed user"
echo ""
echo -e "${YELLOW}For more information, see README-fixed-auto-login.md${NC}" 