#!/bin/bash

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Testing SFTP configuration location fix...${NC}"

# Check if VS Code is running
if pgrep -x "Code" > /dev/null; then
    echo -e "${YELLOW}VS Code is running. Closing it to ensure configuration is reloaded...${NC}"
    killall "Visual Studio Code" 2>/dev/null || killall "Code" 2>/dev/null
    sleep 2
fi

# Verify the symbolic link exists
if [ -L ".vscode/sftp.json" ]; then
    echo -e "${GREEN}✅ Symbolic link .vscode/sftp.json exists and points to $(readlink .vscode/sftp.json)${NC}"
else
    echo -e "${RED}❌ Symbolic link .vscode/sftp.json does not exist${NC}"
    echo -e "${YELLOW}Creating symbolic link...${NC}"
    mkdir -p .vscode
    ln -sf ../vscode-sftp-deploy/.vscode/sftp.json .vscode/sftp.json
    echo -e "${GREEN}✅ Symbolic link created${NC}"
fi

# Check if the vscode-sftp-deploy/.vscode/sftp.json file exists
if [ -f "vscode-sftp-deploy/.vscode/sftp.json" ]; then
    echo -e "${GREEN}✅ vscode-sftp-deploy/.vscode/sftp.json exists${NC}"
else
    echo -e "${RED}❌ vscode-sftp-deploy/.vscode/sftp.json does not exist${NC}"
    exit 1
fi

# Check for any other sftp.json files
OTHER_CONFIGS=$(find . -name "sftp.json" | grep -v ".vscode/sftp.json" | grep -v "vscode-sftp-deploy/.vscode/sftp.json")
if [ -n "$OTHER_CONFIGS" ]; then
    echo -e "${RED}❌ Found other sftp.json files:${NC}"
    echo "$OTHER_CONFIGS"
    echo -e "${YELLOW}Would you like to delete these extra configuration files? (y/n): ${NC}"
    read -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "$OTHER_CONFIGS" | xargs rm
        echo -e "${GREEN}✅ Extra sftp.json files removed.${NC}"
    else
        echo -e "${YELLOW}No files were deleted. Please manually ensure only the correct sftp.json files exist.${NC}"
    fi
else
    echo -e "${GREEN}✅ No other sftp.json files found${NC}"
fi

# Start VS Code
echo -e "${YELLOW}Starting VS Code...${NC}"
code . &
sleep 5

echo -e "${GREEN}Test complete. Please use the VS Code command palette (Cmd+Shift+P) and type 'SFTP: Upload Folder'${NC}"
echo -e "${GREEN}Then select the build folder to upload.${NC}"
echo -e "${GREEN}If the upload is successful, the SFTP configuration fix worked!${NC}"