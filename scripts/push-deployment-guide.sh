#!/bin/bash

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Pushing deployment guide...${NC}"

# Add the modified files to git
echo "Adding files to git..."
git add docs/deployment-guide.md
git add commit-message-deployment-guide.txt
git add scripts/push-deployment-guide.sh

# Commit with the prepared message
git commit -F commit-message-deployment-guide.txt

# Push to the remote repository
echo -e "${YELLOW}Pushing changes to remote repository...${NC}"
git push

echo -e "${GREEN}Deployment guide has been pushed!${NC}"