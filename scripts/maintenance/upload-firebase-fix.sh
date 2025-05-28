#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}AI Sports Edge Firebase Fix Upload${NC}"
echo -e "${BLUE}=========================================${NC}"

# Create a timestamp for logs
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="upload-firebase-fix_${TIMESTAMP}.log"

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

# SFTP connection details
HOST="p3plzcpnl508920.prod.phx3.secureserver.net"
USER="q15133vymhnq"
PASS="hTQ3LQ]#P(b,"
REMOTE_PATH="/home/q15133yvmhnq/public_html/aisportsedge.app"

# Check if the temp-deploy directory exists
log "\n${YELLOW}Step 1: Checking if temp-deploy directory exists...${NC}"
if [ ! -d "temp-deploy" ]; then
  log "${RED}temp-deploy directory not found. Please run deploy-firebase-fix.sh first.${NC}"
  exit 1
fi
check_status "temp-deploy directory check"

# Create batch file for sftp commands
log "\n${YELLOW}Step 2: Creating SFTP batch file...${NC}"
BATCH_FILE=$(mktemp)
echo "cd $REMOTE_PATH" > $BATCH_FILE
echo "put temp-deploy/index.html index.html" >> $BATCH_FILE
echo "put temp-deploy/login.html login.html" >> $BATCH_FILE
echo "put temp-deploy/signup.html signup.html" >> $BATCH_FILE
echo "mkdir -p src/firebase" >> $BATCH_FILE
echo "mkdir -p src/config" >> $BATCH_FILE
echo "cd src/firebase" >> $BATCH_FILE
echo "put temp-deploy/src/firebase/config.js config.js" >> $BATCH_FILE
echo "cd .." >> $BATCH_FILE
echo "cd config" >> $BATCH_FILE
echo "put temp-deploy/src/config/firebase.ts firebase.ts" >> $BATCH_FILE
echo "put temp-deploy/src/config/firebase.js firebase.js" >> $BATCH_FILE
echo "bye" >> $BATCH_FILE
check_status "Creating SFTP batch file"

# Check if sshpass is installed
log "\n${YELLOW}Step 3: Checking if sshpass is installed...${NC}"
if ! command -v sshpass &> /dev/null; then
  log "${YELLOW}sshpass is not installed. Trying to install it...${NC}"
  
  # Try to install sshpass based on the OS
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    brew install hudochenkov/sshpass/sshpass
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v apt-get &> /dev/null; then
      # Debian/Ubuntu
      sudo apt-get install -y sshpass
    elif command -v yum &> /dev/null; then
      # CentOS/RHEL
      sudo yum install -y sshpass
    else
      log "${RED}Could not determine package manager to install sshpass. Please install it manually.${NC}"
      exit 1
    fi
  else
    log "${RED}Unsupported OS. Please install sshpass manually.${NC}"
    exit 1
  fi
  
  # Check if installation was successful
  if ! command -v sshpass &> /dev/null; then
    log "${RED}Failed to install sshpass. Please install it manually:${NC}"
    log "  - macOS: brew install hudochenkov/sshpass/sshpass"
    log "  - Ubuntu/Debian: sudo apt-get install sshpass"
    log "  - CentOS/RHEL: sudo yum install sshpass"
    exit 1
  fi
fi
check_status "sshpass check"

# Upload files using sftp
log "\n${YELLOW}Step 4: Uploading files...${NC}"
log "Host: $HOST"
log "User: $USER"
log "Remote path: $REMOTE_PATH"

# Run sftp with sshpass
log "\n${YELLOW}Uploading files...${NC}"
sshpass -p "$PASS" sftp -o StrictHostKeyChecking=no -b $BATCH_FILE $USER@$HOST
check_status "Uploading files"

# Clean up batch file
rm $BATCH_FILE

log "\n${GREEN}=========================================${NC}"
log "${GREEN}Firebase Fix Upload Completed Successfully${NC}"
log "${GREEN}=========================================${NC}"

log "\n${YELLOW}Post-deployment verification:${NC}"
log "1. Visit https://aisportsedge.app in incognito or hard refresh"
log "2. Test the signup functionality"
log "3. Ensure no Firebase authentication errors"