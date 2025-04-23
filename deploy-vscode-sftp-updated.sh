#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}AI Sports Edge VS Code SFTP Deployment${NC}"
echo -e "${BLUE}=========================================${NC}"

# Create a timestamp for logs
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="deploy-vscode-sftp_${TIMESTAMP}.log"

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

# Step 1: Check if the source directory exists
log "\n${YELLOW}Step 1: Checking source directory...${NC}"
if [ ! -d "vscode-sftp-deploy/.vscode" ]; then
  log "${RED}vscode-sftp-deploy/.vscode directory not found. Please make sure it exists.${NC}"
  exit 1
fi
check_status "Source directory check"

# Step 2: Check if required files exist
log "\n${YELLOW}Step 2: Checking if required files exist...${NC}"
if [ ! -f "vscode-sftp-deploy/.vscode/signup.html" ]; then
  log "${RED}signup.html not found in vscode-sftp-deploy/.vscode directory.${NC}"
  exit 1
fi
if [ ! -f "vscode-sftp-deploy/.vscode/login.html" ]; then
  log "${RED}login.html not found in vscode-sftp-deploy/.vscode directory.${NC}"
  exit 1
fi
if [ ! -f "vscode-sftp-deploy/.vscode/index.html" ]; then
  log "${RED}index.html not found in vscode-sftp-deploy/.vscode directory.${NC}"
  exit 1
fi
if [ ! -f "vscode-sftp-deploy/.vscode/.htaccess" ]; then
  log "${RED}.htaccess not found in vscode-sftp-deploy/.vscode directory.${NC}"
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
check_status "Creating temporary deployment directory"

# Step 5: Copy files to temporary deployment directory
log "\n${YELLOW}Step 5: Copying files to temporary deployment directory...${NC}"
cp vscode-sftp-deploy/.vscode/signup.html "$TEMP_DEPLOY_DIR/signup.html"
cp vscode-sftp-deploy/.vscode/login.html "$TEMP_DEPLOY_DIR/login.html"
cp vscode-sftp-deploy/.vscode/index.html "$TEMP_DEPLOY_DIR/index.html"
cp vscode-sftp-deploy/.vscode/.htaccess "$TEMP_DEPLOY_DIR/.htaccess"
cp vscode-sftp-deploy/.vscode/sftp.json "$TEMP_DEPLOY_DIR/.vscode/sftp.json"
check_status "Copying files to temporary deployment directory"

# Step 6: Create a README file with instructions
log "\n${YELLOW}Step 6: Creating README file...${NC}"
cat > "$TEMP_DEPLOY_DIR/README.md" << EOL
# AI Sports Edge VS Code SFTP Deployment

## Files to Deploy
- signup.html - New signup page with Firebase authentication
- login.html - Updated login page with link to signup
- index.html - Updated index page with navigation link to signup
- .htaccess - Apache configuration for clean URLs and security

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
   - Visit https://aisportsedge.app/signup
   - Visit https://aisportsedge.app/login
   - Visit https://aisportsedge.app/
   - Visit https://aisportsedge.app/deploy (should redirect to root)

## Troubleshooting

If you encounter any issues:
- Check the Output panel in VS Code for SFTP logs
- Verify your SFTP configuration in .vscode/sftp.json
- Try manually uploading the files using an SFTP client
EOL
check_status "Creating README file"

# Step 7: Create a deployment summary
log "\n${YELLOW}Step 7: Creating deployment summary...${NC}"
cat > "vscode-sftp-deployment-summary.md" << EOL
# AI Sports Edge VS Code SFTP Deployment Summary

## Deployment Timestamp
${TIMESTAMP}

## Files Prepared for Deployment
- signup.html - New signup page with Firebase authentication
- login.html - Updated login page with link to signup
- index.html - Updated index page with navigation link to signup
- .htaccess - Apache configuration for clean URLs and security

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
3. Verify the deployment by visiting:
   - https://aisportsedge.app/signup
   - https://aisportsedge.app/login
   - https://aisportsedge.app/
   - https://aisportsedge.app/deploy (should redirect to root)

## Features Implemented
- User registration with email/password
- Password strength meter
- Form validation with user-friendly error messages
- Firebase authentication integration
- Responsive design that matches the existing site
- Clean URLs without .html extension
- Security headers and browser caching

## Next Steps
1. Implement user profile creation after signup
2. Add email verification
3. Add social login options (Google, Apple)
4. Implement account management features
EOL
check_status "Creating deployment summary"

log "\n${GREEN}=========================================${NC}"
log "${GREEN}VS Code SFTP Deployment Prepared Successfully${NC}"
log "${GREEN}Files are ready in the '$TEMP_DEPLOY_DIR' directory${NC}"
log "${GREEN}See vscode-sftp-deployment-summary.md for details${NC}"
log "${GREEN}=========================================${NC}"

# Step 8: Provide instructions for manual deployment
log "\n${YELLOW}Step 8: Manual Deployment Instructions${NC}"
log "To deploy the files using VS Code SFTP:"
log "1. Install the VS Code SFTP extension by Natizyskunk"
log "2. Open the '$TEMP_DEPLOY_DIR' directory in VS Code"
log "3. Right-click on each file and select 'SFTP: Upload'"
log "4. Or use the keyboard shortcut Ctrl+Alt+U (Windows/Linux) or Cmd+Alt+U (Mac)"
log "\nTo verify the deployment, visit:"
log "- https://aisportsedge.app/signup"
log "- https://aisportsedge.app/login"
log "- https://aisportsedge.app/"
log "- https://aisportsedge.app/deploy (should redirect to root)"