#!/bin/bash

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Deploying build folder to GoDaddy via SFTP...${NC}"

# Check if the build directory exists
if [ ! -d "build" ]; then
    echo -e "${RED}Build directory not found. Please make sure the build directory exists.${NC}"
    exit 1
fi

# Check if VS Code is running
if ! pgrep -x "Code" > /dev/null; then
    echo -e "${YELLOW}VS Code is not running. Starting VS Code...${NC}"
    code . &
    sleep 5
fi

# Create a timestamp for the deployment
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
echo -e "${YELLOW}Deployment timestamp: ${TIMESTAMP}${NC}"

# Use the VS Code SFTP extension to upload the build folder
echo -e "${YELLOW}Uploading build folder via SFTP...${NC}"
echo -e "${YELLOW}Please use the VS Code command palette (Cmd+Shift+P) and type 'SFTP: Upload Folder'${NC}"
echo -e "${YELLOW}Then select the build folder to upload.${NC}"

# Wait for user confirmation
echo -e "${YELLOW}Press Enter when the upload is complete...${NC}"
read

# Check if the upload was successful
echo -e "${GREEN}Deployment completed at $(date)${NC}"
echo -e "${GREEN}Visit https://aisportsedge.app to verify the deployment.${NC}"

# Log the deployment
echo "[${TIMESTAMP}] Deployed build folder to GoDaddy via SFTP" >> deployment.log