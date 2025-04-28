#!/bin/bash

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Pushing deployment fix build location script...${NC}"

# Add the modified files to git
echo "Adding files to git..."
git add scripts/deploy-and-fix-build-location.sh
git add commit-message-deploy-fix-build-location.txt
git add scripts/push-deploy-fix-build-location.sh
git add CHANGELOG.md

# Commit with the prepared message
git commit -F commit-message-deploy-fix-build-location.txt

# Push to the remote repository
echo -e "${YELLOW}Pushing changes to remote repository...${NC}"
git push

echo -e "${GREEN}Deployment fix build location script has been pushed!${NC}"