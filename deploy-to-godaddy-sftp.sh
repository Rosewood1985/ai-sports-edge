#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}AI Sports Edge GoDaddy SFTP Deployment${NC}"
echo -e "${BLUE}=========================================${NC}"

# Create a timestamp for logs
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="deploy-godaddy-sftp_${TIMESTAMP}.log"

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

# Step 3: Prompt for SFTP credentials
log "\n${YELLOW}Step 3: Setting up SFTP credentials...${NC}"

# Prompt for SFTP credentials
read -p "Enter SFTP hostname (e.g., sftp.aisportsedge.app): " SFTP_HOST
read -p "Enter SFTP port (default: 22): " SFTP_PORT
SFTP_PORT=${SFTP_PORT:-22}
read -p "Enter SFTP username: " SFTP_USER
read -s -p "Enter SFTP password: " SFTP_PASS
echo ""
read -p "Enter SFTP remote directory (e.g., /public_html or leave empty for root): " SFTP_DIR

check_status "Setting up SFTP credentials"

# Step 4: Create a temporary directory for deployment
log "\n${YELLOW}Step 4: Creating temporary directory for deployment...${NC}"
TEMP_DIR=$(mktemp -d)
check_status "Creating temporary directory"

# Step 5: Copy files to temporary directory
log "\n${YELLOW}Step 5: Copying files to temporary directory...${NC}"
cp aisportsedge-deploy/signup.html "$TEMP_DIR/signup.html"
cp aisportsedge-deploy/login.html "$TEMP_DIR/login.html"
cp aisportsedge-deploy/index.html "$TEMP_DIR/index.html"
check_status "Copying files to temporary directory"

# Step 6: Create SFTP batch file
log "\n${YELLOW}Step 6: Creating SFTP batch file...${NC}"
SFTP_BATCH_FILE="$TEMP_DIR/sftp_batch.txt"

# Write SFTP commands to batch file
cat > "$SFTP_BATCH_FILE" << EOL
cd ${SFTP_DIR}
put ${TEMP_DIR}/signup.html signup.html
put ${TEMP_DIR}/login.html login.html
put ${TEMP_DIR}/index.html index.html
bye
EOL

check_status "Creating SFTP batch file"

# Step 7: Upload files using SFTP
log "\n${YELLOW}Step 7: Uploading files to GoDaddy server...${NC}"

# Check if sshpass is installed
if command -v sshpass &> /dev/null; then
  # Use sshpass to provide password non-interactively
  sshpass -p "$SFTP_PASS" sftp -P "$SFTP_PORT" -o StrictHostKeyChecking=no -b "$SFTP_BATCH_FILE" "$SFTP_USER@$SFTP_HOST"
  SFTP_STATUS=$?
else
  # If sshpass is not available, try using expect
  if command -v expect &> /dev/null; then
    # Create expect script
    EXPECT_SCRIPT="$TEMP_DIR/sftp_expect.exp"
    cat > "$EXPECT_SCRIPT" << EOL
#!/usr/bin/expect -f
spawn sftp -P $SFTP_PORT -o StrictHostKeyChecking=no $SFTP_USER@$SFTP_HOST
expect "password:"
send "$SFTP_PASS\r"
expect "sftp>"
send "cd $SFTP_DIR\r"
expect "sftp>"
send "put $TEMP_DIR/signup.html signup.html\r"
expect "sftp>"
send "put $TEMP_DIR/login.html login.html\r"
expect "sftp>"
send "put $TEMP_DIR/index.html index.html\r"
expect "sftp>"
send "bye\r"
expect eof
EOL
    chmod +x "$EXPECT_SCRIPT"
    
    # Run expect script
    "$EXPECT_SCRIPT"
    SFTP_STATUS=$?
  else
    # If neither sshpass nor expect is available, try using sftp interactively
    log "${YELLOW}Neither sshpass nor expect is installed. Using interactive sftp.${NC}"
    log "${YELLOW}Please enter your password when prompted and follow the instructions.${NC}"
    
    # Create a temporary file with instructions
    INSTRUCTIONS_FILE="$TEMP_DIR/sftp_instructions.txt"
    cat > "$INSTRUCTIONS_FILE" << EOL
SFTP Instructions:
1. Enter your password when prompted
2. Run the following commands:
   cd $SFTP_DIR
   put $TEMP_DIR/signup.html signup.html
   put $TEMP_DIR/login.html login.html
   put $TEMP_DIR/index.html index.html
   bye
EOL
    
    # Display instructions
    cat "$INSTRUCTIONS_FILE"
    
    # Run sftp interactively
    sftp -P "$SFTP_PORT" -o StrictHostKeyChecking=no "$SFTP_USER@$SFTP_HOST"
    SFTP_STATUS=$?
  fi
fi

if [ $SFTP_STATUS -eq 0 ]; then
  check_status "Uploading files with SFTP"
else
  log "${RED}SFTP upload failed. Please check your credentials and try again.${NC}"
  exit 1
fi

# Step 8: Clean up temporary files
log "\n${YELLOW}Step 8: Cleaning up temporary files...${NC}"
rm -rf "$TEMP_DIR"
check_status "Cleaning up temporary files"

# Step 9: Create a deployment summary
log "\n${YELLOW}Step 9: Creating deployment summary...${NC}"

cat > "godaddy-sftp-deployment-summary.md" << EOL
# AI Sports Edge GoDaddy SFTP Deployment Summary

## Deployment Timestamp
${TIMESTAMP}

## Files Uploaded
- signup.html - New signup page with Firebase authentication
- login.html - Updated to include a link to the signup page
- index.html - Updated to include a link to the signup page in the navigation

## Deployment Details
- SFTP Host: $SFTP_HOST
- SFTP Port: $SFTP_PORT
- Remote Directory: ${SFTP_DIR:-Root directory}
- Upload Method: SFTP

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
log "${GREEN}GoDaddy SFTP Deployment Completed Successfully${NC}"
log "${GREEN}See godaddy-sftp-deployment-summary.md for details${NC}"
log "${GREEN}=========================================${NC}"

# Step 10: Provide verification instructions
log "\n${YELLOW}Step 10: Verification Instructions${NC}"
log "To verify the deployment, please visit:"
log "- https://aisportsedge.app/signup.html"
log "- https://aisportsedge.app/login.html"
log "- https://aisportsedge.app/index.html"
log "\nVerify that the signup page works correctly and that the navigation links are working."