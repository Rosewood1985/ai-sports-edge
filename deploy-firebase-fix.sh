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

# Step 1: Check if the source directories exist
log "\n${YELLOW}Step 1: Checking source directories...${NC}"
if [ ! -d "aisportsedge-deploy" ]; then
  log "${RED}aisportsedge-deploy directory not found. Please make sure it exists.${NC}"
  exit 1
fi
if [ ! -d "src/firebase" ]; then
  log "${RED}src/firebase directory not found. Please make sure it exists.${NC}"
  exit 1
fi
if [ ! -d "src/config" ]; then
  log "${RED}src/config directory not found. Please make sure it exists.${NC}"
  exit 1
fi
check_status "Source directories check"

# Step 2: Check if required files exist
log "\n${YELLOW}Step 2: Checking if required files exist...${NC}"
if [ ! -f "aisportsedge-deploy/index.html" ]; then
  log "${RED}index.html not found in aisportsedge-deploy directory.${NC}"
  exit 1
fi
if [ ! -f "src/firebase/config.js" ]; then
  log "${RED}config.js not found in src/firebase directory.${NC}"
  exit 1
fi
if [ ! -f "src/config/firebase.ts" ]; then
  log "${RED}firebase.ts not found in src/config directory.${NC}"
  exit 1
fi
if [ ! -f "src/config/firebase.js" ]; then
  log "${RED}firebase.js not found in src/config directory.${NC}"
  exit 1
fi
check_status "Required files check"

# Step 3: Check if VS Code SFTP extension is installed
log "\n${YELLOW}Step 3: Checking VS Code SFTP configuration...${NC}"
if [ ! -f "vscode-sftp-deploy/.vscode/sftp.json" ]; then
  log "${RED}vscode-sftp-deploy/.vscode/sftp.json not found. Please make sure the VS Code SFTP configuration is set up.${NC}"
  exit 1
fi
check_status "VS Code SFTP configuration check"

# Step 4: Create a temporary deployment directory
log "\n${YELLOW}Step 4: Creating temporary deployment directory...${NC}"
TEMP_DEPLOY_DIR="temp-deploy"
if [ -d "$TEMP_DEPLOY_DIR" ]; then
  rm -rf "$TEMP_DEPLOY_DIR"
fi
mkdir -p "$TEMP_DEPLOY_DIR/.vscode"
mkdir -p "$TEMP_DEPLOY_DIR/src/firebase"
mkdir -p "$TEMP_DEPLOY_DIR/src/config"
check_status "Creating temporary deployment directory"

# Step 5: Copy files to temporary deployment directory
log "\n${YELLOW}Step 5: Copying files to temporary deployment directory...${NC}"
cp aisportsedge-deploy/index.html "$TEMP_DEPLOY_DIR/index.html"
cp aisportsedge-deploy/login.html "$TEMP_DEPLOY_DIR/login.html"
cp aisportsedge-deploy/signup.html "$TEMP_DEPLOY_DIR/signup.html"
cp src/firebase/config.js "$TEMP_DEPLOY_DIR/src/firebase/config.js"
cp src/config/firebase.ts "$TEMP_DEPLOY_DIR/src/config/firebase.ts"
cp src/config/firebase.js "$TEMP_DEPLOY_DIR/src/config/firebase.js"
cp vscode-sftp-deploy/.vscode/sftp.json "$TEMP_DEPLOY_DIR/.vscode/sftp.json"
check_status "Copying files to temporary deployment directory"

# Step 6: Create a README file with instructions
log "\n${YELLOW}Step 6: Creating README file...${NC}"
cat > "$TEMP_DEPLOY_DIR/README.md" << EOL
# AI Sports Edge Firebase Fix Deployment

## Files to Deploy
- index.html - Main entry point
- login.html - Login page
- signup.html - Signup page
- src/firebase/config.js - Firebase configuration
- src/config/firebase.ts - TypeScript Firebase configuration
- src/config/firebase.js - JavaScript Firebase configuration

## Deployment Instructions

1. Install the VS Code SFTP extension if you haven't already:
   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X or Cmd+Shift+X)
   - Search for "SFTP" by Natizyskunk
   - Click Install

2. Open this directory in VS Code:
   - File > Open Folder... > Select this directory

3. Deploy the files:
   - Right-click on each file in the Explorer
   - Select "SFTP: Upload"
   - Or use the keyboard shortcut Ctrl+Alt+U (Windows/Linux) or Cmd+Alt+U (Mac)

4. Verify the deployment:
   - Visit https://aisportsedge.app/
   - Test the signup functionality
EOL
check_status "Creating README file"

# Step 7: Create a deployment summary
log "\n${YELLOW}Step 7: Creating deployment summary...${NC}"
cat > "firebase-fix-deployment-summary.md" << EOL
# AI Sports Edge Firebase Fix Deployment Summary

## Deployment Timestamp
${TIMESTAMP}

## Files Prepared for Deployment
- index.html - Main entry point
- login.html - Login page
- signup.html - Signup page
- src/firebase/config.js - Firebase configuration
- src/config/firebase.ts - TypeScript Firebase configuration
- src/config/firebase.js - JavaScript Firebase configuration

## Deployment Method
VS Code SFTP Extension

## SFTP Configuration
- Host: $(grep -o '"host": "[^"]*' vscode-sftp-deploy/.vscode/sftp.json | cut -d'"' -f4)
- Port: $(grep -o '"port": [0-9]*' vscode-sftp-deploy/.vscode/sftp.json | cut -d':' -f2 | tr -d ' ')
- Username: $(grep -o '"username": "[^"]*' vscode-sftp-deploy/.vscode/sftp.json | cut -d'"' -f4)
- Remote Path: $(grep -o '"remotePath": "[^"]*' vscode-sftp-deploy/.vscode/sftp.json | cut -d'"' -f4)

## Deployment Instructions
1. Open the "$TEMP_DEPLOY_DIR" directory in VS Code
2. Use the SFTP extension to upload the files
3. Verify the deployment by testing the signup functionality

## Changes Made
- Updated Firebase configuration with correct messagingSenderId and appId
- Fixed signup functionality by ensuring Firebase authentication works correctly
EOL
check_status "Creating deployment summary"

log "\n${GREEN}=========================================${NC}"
log "${GREEN}Firebase Fix Deployment Prepared Successfully${NC}"
log "${GREEN}Files are ready in the '$TEMP_DEPLOY_DIR' directory${NC}"
log "${GREEN}See firebase-fix-deployment-summary.md for details${NC}"
log "${GREEN}=========================================${NC}"

# Step 8: Provide instructions for manual deployment
log "\n${YELLOW}Step 8: Manual Deployment Instructions${NC}"
log "To deploy the files using VS Code SFTP:"
log "1. Install the VS Code SFTP extension by Natizyskunk"
log "2. Open the '$TEMP_DEPLOY_DIR' directory in VS Code"
log "3. Right-click on each file and select 'SFTP: Upload'"
log "4. Or use the keyboard shortcut Ctrl+Alt+U (Windows/Linux) or Cmd+Alt+U (Mac)"
log "\nTo verify the deployment, test the signup functionality at:"
log "- https://aisportsedge.app/signup"