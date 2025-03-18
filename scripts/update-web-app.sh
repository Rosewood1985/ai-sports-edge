#!/bin/bash
# Script to update the web app with the latest changes

# Navigate to the project root directory
cd /Users/lisadario/Desktop/ai-sports-edge

# Set text colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to display section headers
section() {
    echo -e "\n${BLUE}==== $1 ====${NC}\n"
}

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is not installed. Please install Node.js and npm to run this script.${NC}"
    exit 1
fi

# Build the web app
section "Building Web App"
npm run build-web

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to build web app.${NC}"
    exit 1
fi

echo -e "${GREEN}Web app built successfully.${NC}"

# Deploy to Firebase
section "Deploying to Firebase"

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}Firebase CLI is not installed. Please install it with 'npm install -g firebase-tools'.${NC}"
    exit 1
fi

# Check if user is logged in to Firebase
firebase projects:list &> /dev/null
if [ $? -ne 0 ]; then
    section "Logging in to Firebase"
    firebase login
fi

# Deploy to Firebase
firebase deploy --only hosting

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to deploy to Firebase.${NC}"
    exit 1
fi

echo -e "${GREEN}Web app deployed successfully.${NC}"

# Open the web app in the browser
section "Opening Web App"
open https://ai-sports-edge.web.app

section "Update Complete"
echo -e "${GREEN}The web app has been updated and deployed successfully.${NC}"
echo -e "You can access the web app at: ${YELLOW}https://ai-sports-edge.web.app${NC}"