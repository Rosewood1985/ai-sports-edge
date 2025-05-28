#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}AI Sports Edge GoDaddy FTP Deployment${NC}"
echo -e "${BLUE}=========================================${NC}"

# Create a timestamp for logs
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="deploy-godaddy-ftp_${TIMESTAMP}.log"

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

# Step 1: Check if the aisportsedge-deploy directory exists
log "\n${YELLOW}Step 1: Checking aisportsedge-deploy directory...${NC}"
if [ ! -d "aisportsedge-deploy" ]; then
  log "${RED}aisportsedge-deploy directory not found. Please make sure it exists.${NC}"
  exit 1
fi
check_status "aisportsedge-deploy directory check"

# Step 2: Check if required files exist
log "\n${YELLOW}Step 2: Checking if required files exist...${NC}"
if [ ! -f "aisportsedge-deploy/signup.html" ]; then
  log "${RED}signup.html not found in aisportsedge-deploy directory. Please run deploy-to-godaddy.sh first.${NC}"
  exit 1
fi
if [ ! -f "aisportsedge-deploy/login.html" ]; then
  log "${RED}login.html not found in aisportsedge-deploy directory.${NC}"
  exit 1
fi
if [ ! -f "aisportsedge-deploy/index.html" ]; then
  log "${RED}index.html not found in aisportsedge-deploy directory.${NC}"
  exit 1
fi
check_status "Required files check"

# Step 3: Prompt for FTP credentials
log "\n${YELLOW}Step 3: Setting up FTP credentials...${NC}"

# Create a temporary file to store FTP credentials
FTP_CREDENTIALS_FILE=$(mktemp)

# Prompt for FTP credentials
read -p "Enter FTP hostname (e.g., ftp.aisportsedge.app): " FTP_HOST
read -p "Enter FTP username: " FTP_USER
read -s -p "Enter FTP password: " FTP_PASS
echo ""
read -p "Enter FTP remote directory (e.g., /public_html or leave empty for root): " FTP_DIR

# Write FTP credentials to temporary file
cat > "$FTP_CREDENTIALS_FILE" << EOL
machine $FTP_HOST
login $FTP_USER
password $FTP_PASS
EOL

chmod 600 "$FTP_CREDENTIALS_FILE"
check_status "Setting up FTP credentials"

# Step 4: Create FTP script
log "\n${YELLOW}Step 4: Creating FTP script...${NC}"

# Create a temporary file for FTP commands
FTP_COMMANDS_FILE=$(mktemp)

# Write FTP commands to file
cat > "$FTP_COMMANDS_FILE" << EOL
cd $FTP_DIR
put aisportsedge-deploy/signup.html signup.html
put aisportsedge-deploy/login.html login.html
put aisportsedge-deploy/index.html index.html
bye
EOL

check_status "Creating FTP script"

# Step 5: Upload files using FTP
log "\n${YELLOW}Step 5: Uploading files to GoDaddy server...${NC}"

# Check if lftp is installed
if ! command -v lftp &> /dev/null; then
  log "${YELLOW}lftp is not installed. Trying with curl instead.${NC}"
  
  # Try with curl
  if command -v curl &> /dev/null; then
    # Upload signup.html
    curl -T aisportsedge-deploy/signup.html -u "$FTP_USER:$FTP_PASS" "ftp://$FTP_HOST$FTP_DIR/signup.html"
    check_status "Uploading signup.html with curl"
    
    # Upload login.html
    curl -T aisportsedge-deploy/login.html -u "$FTP_USER:$FTP_PASS" "ftp://$FTP_HOST$FTP_DIR/login.html"
    check_status "Uploading login.html with curl"
    
    # Upload index.html
    curl -T aisportsedge-deploy/index.html -u "$FTP_USER:$FTP_PASS" "ftp://$FTP_HOST$FTP_DIR/index.html"
    check_status "Uploading index.html with curl"
  else
    # Try with ftp command
    if command -v ftp &> /dev/null; then
      # Create a temporary file for FTP commands
      FTP_SCRIPT=$(mktemp)
      
      # Write FTP commands to file
      cat > "$FTP_SCRIPT" << EOL
open $FTP_HOST
user $FTP_USER $FTP_PASS
cd $FTP_DIR
put aisportsedge-deploy/signup.html signup.html
put aisportsedge-deploy/login.html login.html
put aisportsedge-deploy/index.html index.html
bye
EOL
      
      # Execute FTP commands
      ftp -n < "$FTP_SCRIPT"
      check_status "Uploading files with ftp command"
      
      # Remove temporary FTP script
      rm "$FTP_SCRIPT"
    else
      log "${RED}Neither lftp, curl, nor ftp is installed. Please install one of these tools to upload files.${NC}"
      exit 1
    fi
  fi
else
  # Use lftp to upload files
  lftp -f "$FTP_COMMANDS_FILE" -u "$FTP_USER,$FTP_PASS" "$FTP_HOST"
  check_status "Uploading files with lftp"
fi

# Step 6: Clean up temporary files
log "\n${YELLOW}Step 6: Cleaning up temporary files...${NC}"
rm "$FTP_CREDENTIALS_FILE"
rm "$FTP_COMMANDS_FILE"
check_status "Cleaning up temporary files"

# Step 7: Create a deployment summary
log "\n${YELLOW}Step 7: Creating deployment summary...${NC}"

cat > "godaddy-ftp-deployment-summary.md" << EOL
# AI Sports Edge GoDaddy FTP Deployment Summary

## Deployment Timestamp
${TIMESTAMP}

## Files Uploaded
- signup.html - New signup page with Firebase authentication
- login.html - Updated to include a link to the signup page
- index.html - Updated to include a link to the signup page in the navigation

## Deployment Details
- FTP Host: $FTP_HOST
- Remote Directory: ${FTP_DIR:-Root directory}
- Upload Method: ${command -v lftp &> /dev/null && echo "lftp" || (command -v curl &> /dev/null && echo "curl" || echo "ftp")}

## Features Implemented
- User registration with email/password
- Password strength meter
- Form validation with user-friendly error messages
- Firebase authentication integration
- Responsive design that matches the existing site

## Verification Steps
1. Navigate to:
   - https://aisportsedge.app/signup.html
   - https://aisportsedge.app/login.html
   - https://aisportsedge.app/index.html

2. Verify that:
   - The signup page loads correctly
   - The password strength meter works
   - Form validation works
   - Users can create accounts
   - The login page has a link to the signup page
   - The main navigation includes a link to the signup page

## Next Steps
1. Implement user profile creation after signup
2. Add email verification
3. Add social login options (Google, Apple)
4. Implement account management features
EOL

check_status "Creating deployment summary"

log "\n${GREEN}=========================================${NC}"
log "${GREEN}GoDaddy FTP Deployment Completed Successfully${NC}"
log "${GREEN}See godaddy-ftp-deployment-summary.md for details${NC}"
log "${GREEN}=========================================${NC}"

# Step 8: Provide verification instructions
log "\n${YELLOW}Step 8: Verification Instructions${NC}"
log "To verify the deployment, please visit:"
log "- https://aisportsedge.app/signup.html"
log "- https://aisportsedge.app/login.html"
log "- https://aisportsedge.app/index.html"
log "\nVerify that the signup page works correctly and that the navigation links are working."