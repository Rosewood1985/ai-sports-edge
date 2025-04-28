#!/bin/bash

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Pushing permissions and build fix script...${NC}"

# Add the modified files to git
echo "Adding files to git..."
git add fix-permissions-and-build.sh
git add scripts/upload-fix-script.sh
git add commit-message-permissions-and-build-fix.txt
git add scripts/push-permissions-and-build-fix.sh

# Commit with the prepared message
git commit -F commit-message-permissions-and-build-fix.txt

# Push to the remote repository
echo -e "${YELLOW}Pushing changes to remote repository...${NC}"
git push

echo -e "${GREEN}Permissions and build fix script has been pushed!${NC}"