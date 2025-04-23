#!/bin/bash

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Pushing GitHub Actions workflow...${NC}"

# Add the modified files to git
echo "Adding files to git..."
git add .github/workflows/deploy-to-godaddy.yml
git add commit-message-github-actions.txt
git add scripts/push-github-actions.sh

# Commit with the prepared message
git commit -F commit-message-github-actions.txt

# Push to the remote repository
echo -e "${YELLOW}Pushing changes to remote repository...${NC}"
git push

echo -e "${GREEN}GitHub Actions workflow has been pushed!${NC}"