#!/bin/bash

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Pushing manual fallback deployment script...${NC}"

# Add the modified files to git
echo "Adding files to git..."
git add scripts/manual-fallback-deploy.sh
git add commit-message-manual-fallback.txt
git add scripts/push-manual-fallback.sh

# Commit with the prepared message
git commit -F commit-message-manual-fallback.txt

# Push to the remote repository
echo -e "${YELLOW}Pushing changes to remote repository...${NC}"
git push

echo -e "${GREEN}Manual fallback deployment script has been pushed!${NC}"