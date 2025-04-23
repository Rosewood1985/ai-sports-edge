#!/bin/bash

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Pushing SFTP config location fix...${NC}"

# Add the modified files to git
echo "Adding files to git..."
git add .vscode/sftp.json
git add sftp-config-fix-summary.md
git add commit-message-sftp-config-location-fix.txt
git add scripts/push-sftp-config-location-fix.sh
git add scripts/test-sftp-config-location-fix.sh
git add CHANGELOG.md

# Commit with the prepared message
git commit -F commit-message-sftp-config-location-fix.txt

# Push to the remote repository
echo -e "${YELLOW}Pushing changes to remote repository...${NC}"
git push

echo -e "${GREEN}SFTP config location fix has been pushed!${NC}"