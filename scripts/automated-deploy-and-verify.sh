#!/bin/bash

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Automated Deployment and Verification...${NC}"

# Extract credentials from SFTP config
echo -e "${YELLOW}Extracting SFTP credentials from configuration...${NC}"
SFTP_CONFIG="vscode-sftp-deploy/.vscode/sftp.json"

if [ ! -f "$SFTP_CONFIG" ]; then
    echo -e "${RED}❌ SFTP configuration file not found at $SFTP_CONFIG${NC}"
    exit 1
fi

SFTP_HOST=$(grep -o '"host": *"[^"]*"' "$SFTP_CONFIG" | sed 's/"host": *"\(.*\)"/\1/')
SFTP_USER=$(grep -o '"username": *"[^"]*"' "$SFTP_CONFIG" | sed 's/"username": *"\(.*\)"/\1/')
SFTP_PASSWORD=$(grep -o '"password": *"[^"]*"' "$SFTP_CONFIG" | sed 's/"password": *"\(.*\)"/\1/')
SFTP_REMOTE_PATH=$(grep -o '"remotePath": *"[^"]*"' "$SFTP_CONFIG" | sed 's/"remotePath": *"\(.*\)"/\1/')
SFTP_PORT=$(grep -o '"port": *[0-9]*' "$SFTP_CONFIG" | sed 's/"port": *\([0-9]*\)/\1/')

if [ -z "$SFTP_HOST" ] || [ -z "$SFTP_USER" ] || [ -z "$SFTP_PASSWORD" ] || [ -z "$SFTP_REMOTE_PATH" ]; then
    echo -e "${RED}❌ Failed to extract all required credentials from SFTP config${NC}"
    exit 1
fi

echo -e "${GREEN}✅ SFTP credentials extracted successfully${NC}"
echo -e "   Host: $SFTP_HOST"
echo -e "   User: $SFTP_USER"
echo -e "   Remote Path: $SFTP_REMOTE_PATH"
echo -e "   Port: ${SFTP_PORT:-22}"

# Check if build directory exists
if [ ! -d "build" ]; then
    echo -e "${RED}❌ Build directory not found${NC}"
    exit 1
fi

# Copy the fix script to the build directory
echo -e "${YELLOW}Copying fix script to build directory...${NC}"
cp fix-permissions-and-build.sh build/fix-permissions-and-build.sh
echo -e "${GREEN}✅ Fix script copied to build directory${NC}"

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    echo -e "${YELLOW}sshpass is not installed. Attempting to install...${NC}"
    if command -v brew &> /dev/null; then
        brew install sshpass
    elif command -v apt-get &> /dev/null; then
        sudo apt-get install -y sshpass
    elif command -v yum &> /dev/null; then
        sudo yum install -y sshpass
    else
        echo -e "${RED}❌ Unable to install sshpass automatically. Please install it manually.${NC}"
        echo -e "${YELLOW}For macOS: brew install sshpass${NC}"
        echo -e "${YELLOW}For Ubuntu/Debian: sudo apt-get install sshpass${NC}"
        echo -e "${YELLOW}For CentOS/RHEL: sudo yum install sshpass${NC}"
        exit 1
    fi
fi

# Check if lftp is installed
if ! command -v lftp &> /dev/null; then
    echo -e "${YELLOW}lftp is not installed. Attempting to install...${NC}"
    if command -v brew &> /dev/null; then
        brew install lftp
    elif command -v apt-get &> /dev/null; then
        sudo apt-get install -y lftp
    elif command -v yum &> /dev/null; then
        sudo yum install -y lftp
    else
        echo -e "${RED}❌ Unable to install lftp automatically. Please install it manually.${NC}"
        echo -e "${YELLOW}For macOS: brew install lftp${NC}"
        echo -e "${YELLOW}For Ubuntu/Debian: sudo apt-get install lftp${NC}"
        echo -e "${YELLOW}For CentOS/RHEL: sudo yum install lftp${NC}"
        exit 1
    fi
fi

# Upload build folder via SFTP
echo -e "${YELLOW}Uploading build folder via SFTP...${NC}"
lftp -c "set sftp:auto-confirm yes; open -u $SFTP_USER,$SFTP_PASSWORD sftp://$SFTP_HOST:${SFTP_PORT:-22}; mirror -R build $SFTP_REMOTE_PATH"

# Check if upload was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build folder uploaded successfully${NC}"
else
    echo -e "${RED}❌ Failed to upload build folder${NC}"
    exit 1
fi

# SSH into server and run fix script
echo -e "${YELLOW}SSH into server and running fix script...${NC}"
sshpass -p "$SFTP_PASSWORD" ssh -o StrictHostKeyChecking=no -p "${SFTP_PORT:-22}" "$SFTP_USER@$SFTP_HOST" "cd $SFTP_REMOTE_PATH && chmod +x fix-permissions-and-build.sh && ./fix-permissions-and-build.sh"

# Check if SSH command was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Fix script executed successfully on server${NC}"
else
    echo -e "${RED}❌ Failed to execute fix script on server${NC}"
    exit 1
fi

# Verify deployment
echo -e "${YELLOW}Verifying deployment...${NC}"

# Check if .htaccess exists on server
echo -e "${YELLOW}Checking if .htaccess exists on server...${NC}"
HTACCESS_CHECK=$(sshpass -p "$SFTP_PASSWORD" ssh -o StrictHostKeyChecking=no -p "${SFTP_PORT:-22}" "$SFTP_USER@$SFTP_HOST" "cd $SFTP_REMOTE_PATH && [ -f .htaccess ] && echo 'exists' || echo 'not exists'")

if [ "$HTACCESS_CHECK" = "exists" ]; then
    echo -e "${GREEN}✅ .htaccess file exists on server${NC}"
else
    echo -e "${RED}❌ .htaccess file does not exist on server${NC}"
fi

# Check HTTP status of the website
echo -e "${YELLOW}Checking HTTP status of the website...${NC}"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://aisportsedge.app)

if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Website returns HTTP 200 OK${NC}"
else
    echo -e "${RED}❌ Website returns HTTP $HTTP_STATUS${NC}"
fi

# Check if assets are loading
echo -e "${YELLOW}Checking if assets are loading...${NC}"
ASSETS_CHECK=$(curl -s https://aisportsedge.app | grep -E 'bundle\.js|styles\.css' | wc -l)

if [ "$ASSETS_CHECK" -gt 0 ]; then
    echo -e "${GREEN}✅ Assets are referenced in the HTML${NC}"
else
    echo -e "${RED}❌ Assets are not referenced in the HTML${NC}"
fi

# Run detailed deployment check
echo -e "${YELLOW}Running detailed deployment check...${NC}"
./scripts/detailed-deployment-check.sh

echo -e "\n${GREEN}🎉 Automated Deployment and Verification Complete!${NC}"
echo -e "${YELLOW}Please verify the site manually at https://aisportsedge.app${NC}"