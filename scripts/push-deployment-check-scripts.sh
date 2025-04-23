#!/bin/bash

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Pushing deployment check scripts...${NC}"

# Add the modified files to git
echo "Adding files to git..."
git add scripts/check-deployment-status.sh
git add scripts/detailed-deployment-check.sh
git add commit-message-deployment-check-scripts.txt
git add scripts/push-deployment-check-scripts.sh

# Commit with the prepared message
git commit -F commit-message-deployment-check-scripts.txt

# Push to the remote repository
echo -e "${YELLOW}Pushing changes to remote repository...${NC}"
git push

echo -e "${GREEN}Deployment check scripts have been pushed!${NC}"