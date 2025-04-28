#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}AI Sports Edge Firebase Fix Deployment${NC}"
echo -e "${BLUE}=========================================${NC}"

# Create a timestamp for logs
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="deploy-firebase-fix_${TIMESTAMP}.log"

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

# Step 1: Run the Firebase service initialization debugger
log "\n${YELLOW}Step 1: Running Firebase service initialization debugger...${NC}"
node debug-service-init.js
check_status "Firebase service initialization debugger"

# Step 2: Run the services debugger
log "\n${YELLOW}Step 2: Running services debugger...${NC}"
node debug-services.js
check_status "Services debugger"

# Step 3: Run the detailed app debugger
log "\n${YELLOW}Step 3: Running detailed app debugger...${NC}"
node debug-app-detailed.js
check_status "Detailed app debugger"

# Step 4: Update deployment scripts to use production environment
log "\n${YELLOW}Step 4: Updating deployment scripts to use production environment...${NC}"

# Update deploy.sh
if [ -f "deploy.sh" ]; then
  sed -i 's/npm run build/NODE_ENV=production npm run build:prod/g' deploy.sh
  check_status "Updating deploy.sh"
fi

# Update deploy-api-key-security.sh
if [ -f "deploy-api-key-security.sh" ]; then
  sed -i 's/npm run build/NODE_ENV=production npm run build:prod/g' deploy-api-key-security.sh
  check_status "Updating deploy-api-key-security.sh"
fi

# Update deploy-ai-features.sh
if [ -f "deploy-ai-features.sh" ]; then
  sed -i 's/npm run build/NODE_ENV=production npm run build:prod/g' deploy-ai-features.sh
  check_status "Updating deploy-ai-features.sh"
fi

# Step 5: Update Firebase configuration in dist/login.html
log "\n${YELLOW}Step 5: Updating Firebase configuration in dist/login.html...${NC}"
if [ -f "dist/login.html" ]; then
  # Check if measurementId is already added
  if ! grep -q "measurementId" "dist/login.html"; then
    # Use sed to add measurementId to the Firebase configuration
    sed -i '/appId: "[^"]*"/a\        measurementId: "G-ABCDEF1234"' dist/login.html
    check_status "Adding measurementId to Firebase configuration"
  else
    log "${GREEN}measurementId already exists in Firebase configuration${NC}"
  fi
else
  log "${RED}dist/login.html not found${NC}"
fi

# Step 6: Build the application with production environment
log "\n${YELLOW}Step 6: Building the application with production environment...${NC}"
NODE_ENV=production npm run build:prod
check_status "Building application"

# Step 7: Deploy to Firebase
log "\n${YELLOW}Step 7: Deploying to Firebase...${NC}"
firebase deploy
check_status "Firebase deployment"

# Step 8: Create a summary report
log "\n${YELLOW}Step 8: Creating summary report...${NC}"
cat > "firebase-fix-deployment-summary.md" << EOL
# Firebase Fix Deployment Summary

## Deployment Timestamp
${TIMESTAMP}

## Steps Completed
1. ✓ Ran Firebase service initialization debugger
2. ✓ Ran services debugger
3. ✓ Ran detailed app debugger
4. ✓ Updated deployment scripts to use production environment
5. ✓ Updated Firebase configuration in dist/login.html
6. ✓ Built the application with production environment
7. ✓ Deployed to Firebase

## Next Steps
1. Verify that the signup flow works correctly
2. Implement the remaining recommendations from the debug reports
3. Add comprehensive testing for authentication flows
4. Improve error handling and user feedback

## Documentation
- Firebase Auth Fix Summary: firebase-auth-fix-summary.md
- Debugging Summary: debugging-summary.md
- Services Debug Report: services-debug-report.md
EOL

check_status "Creating summary report"

log "\n${GREEN}=========================================${NC}"
log "${GREEN}Firebase Fix Deployment Completed Successfully${NC}"
log "${GREEN}See firebase-fix-deployment-summary.md for details${NC}"
log "${GREEN}=========================================${NC}"