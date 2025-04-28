#!/bin/bash

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Testing SFTP configuration fix...${NC}"

# Check if VS Code is running
if pgrep -x "Code" > /dev/null; then
    echo -e "${YELLOW}VS Code is running. Closing it to ensure configuration is reloaded...${NC}"
    killall "Visual Studio Code" 2>/dev/null || killall "Code" 2>/dev/null
    sleep 2
fi

# Restart VS Code
echo -e "${YELLOW}Starting VS Code...${NC}"
code . &
sleep 5

# Check if the build directory exists
if [ ! -d "build" ]; then
    echo -e "${RED}Build directory not found. Please make sure the build directory exists.${NC}"
    exit 1
fi

# Use the VS Code SFTP extension to upload the build folder
echo -e "${YELLOW}Attempting to upload build folder via SFTP...${NC}"
echo -e "${YELLOW}Please use the VS Code command palette (Cmd+Shift+P) and type 'SFTP: Upload Folder'${NC}"
echo -e "${YELLOW}Then select the build folder to upload.${NC}"
echo -e "${YELLOW}If the upload is successful, the SFTP configuration fix worked!${NC}"

echo -e "${GREEN}Test complete. Check VS Code output for SFTP logs.${NC}"
echo -e "${YELLOW}If you see 'Config Not Found' errors, the fix did not work.${NC}"
echo -e "${YELLOW}If the upload completes successfully, the fix worked!${NC}"