#!/bin/bash

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Preparing to deploy fix...${NC}"

# Copy the fix script to the build directory
echo -e "${YELLOW}Copying permissions and build fix script to build directory...${NC}"
cp fix-permissions-and-build.sh build/fix-permissions-and-build.sh

# Check if VS Code is running
if ! pgrep -x "Code" > /dev/null; then
    echo -e "${YELLOW}VS Code is not running. Starting VS Code...${NC}"
    code . &
    sleep 5
fi

# Use the VS Code SFTP extension to upload the build folder
echo -e "${YELLOW}Please use the VS Code command palette (Cmd+Shift+P) and type 'SFTP: Upload Folder'${NC}"
echo -e "${YELLOW}Then select the build folder to upload.${NC}"
echo -e "${YELLOW}After upload completes, you'll need to run the fix script on the server.${NC}"
echo -e "${YELLOW}SSH into the server and run:${NC}"
echo -e "${GREEN}cd /home/q15133yvmhnq/public_html/aisportsedge.app && chmod +x fix-permissions-and-build.sh && ./fix-permissions-and-build.sh${NC}"

echo -e "\n${YELLOW}After running the script, verify deployment at https://aisportsedge.app${NC}"