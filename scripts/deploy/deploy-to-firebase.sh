#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}AI Sports Edge Firebase Deployment${NC}"
echo -e "${BLUE}=========================================${NC}"

# Create a timestamp for logs
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="deploy-firebase_${TIMESTAMP}.log"

# Function to log messages
log() {
  echo -e "$1" | tee -a "$LOG_FILE"
}

# Function to check if a command succeeded
check_status() {
  if [ $? -eq 0 ]; then
    log "${GREEN}✓ $1 completed successfully${NC}"
  else
    log "${RED}✗ $1 failed${NC}"
    exit 1
  fi
}

# Step 1: Check if Firebase CLI is installed
log "\n${YELLOW}Step 1: Checking Firebase CLI...${NC}"
if ! command -v firebase &> /dev/null; then
  log "${RED}Firebase CLI not found. Please install it with 'npm install -g firebase-tools'${NC}"
  exit 1
fi
check_status "Firebase CLI check"

# Step 2: Ensure we have the deploy directory
log "\n${YELLOW}Step 2: Checking deploy directory...${NC}"
if [ ! -d "deploy" ]; then
  log "${RED}Deploy directory not found. Please run build-and-deploy.js first.${NC}"
  exit 1
fi
check_status "Deploy directory check"

# Step 3: Deploy to Firebase Hosting
log "\n${YELLOW}Step 3: Deploying to Firebase Hosting...${NC}"

# Create a temporary firebase.json file for hosting
cat > firebase.json.temp << 'EOL'
{
  "hosting": {
    "public": "deploy",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "/signup",
        "destination": "/signup.html"
      },
      {
        "source": "/login",
        "destination": "/login.html"
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
EOL

# Backup the original firebase.json if it exists
if [ -f "firebase.json" ]; then
  cp firebase.json firebase.json.backup
  log "${YELLOW}Original firebase.json backed up to firebase.json.backup${NC}"
fi

# Use the temporary firebase.json
cp firebase.json.temp firebase.json
check_status "Creating firebase.json"

# Deploy to Firebase
firebase deploy --only hosting
check_status "Firebase hosting deployment"

# Restore the original firebase.json if it was backed up
if [ -f "firebase.json.backup" ]; then
  cp firebase.json.backup firebase.json
  rm firebase.json.backup
  check_status "Restoring original firebase.json"
fi

# Remove the temporary file
rm firebase.json.temp

# Step 4: Create a summary report
log "\n${YELLOW}Step 4: Creating summary report...${NC}"

cat > "firebase-deployment-summary.md" << EOL
# AI Sports Edge Firebase Deployment Summary

## Deployment Timestamp
${TIMESTAMP}

## Steps Completed
1. ✓ Verified Firebase CLI installation
2. ✓ Verified deploy directory exists
3. ✓ Deployed to Firebase Hosting

## Deployed Files
- index.html - Main entry point with client-side routing
- login.html - Redirect to main app with login route
- signup.html - Redirect to main app with signup route
- bundle.js - JavaScript bundle with routing and UI logic
- styles.css - Styling for the application

## Firebase Hosting Features
- Custom rewrites for /login and /signup routes
- Client-side routing support
- Fast global CDN distribution

## Access Your Deployed App
Your app should now be available at:
- https://ai-sports-edge.web.app
- https://ai-sports-edge.firebaseapp.com

## Next Steps
1. Set up Firebase Authentication in the Firebase Console
2. Configure Firestore security rules
3. Implement actual Firebase authentication in the app
4. Add analytics to track signup conversion rates
EOL

check_status "Creating summary report"

log "\n${GREEN}=========================================${NC}"
log "${GREEN}Firebase Deployment Completed Successfully${NC}"
log "${GREEN}See firebase-deployment-summary.md for details${NC}"
log "${GREEN}=========================================${NC}"