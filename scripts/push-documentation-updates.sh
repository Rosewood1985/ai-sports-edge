#!/bin/bash

# Script to push documentation updates to GitHub
# Usage: ./scripts/push-documentation-updates.sh "Commit message"

# Default commit message if not provided
COMMIT_MESSAGE=${1:-"Update documentation for pre-deployment status"}

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Pushing documentation updates to GitHub...${NC}"

# Check if there are any changes to commit
if git diff --quiet; then
    echo -e "${YELLOW}No changes detected. Checking for untracked files...${NC}"
fi

# Add all documentation files
echo -e "${GREEN}Adding documentation files...${NC}"
git add docs/*.md README.md

# Check if there are any changes to commit after adding
if git diff --cached --quiet; then
    echo -e "${RED}No documentation changes to commit.${NC}"
    exit 0
fi

# Commit changes
echo -e "${GREEN}Committing changes with message: ${COMMIT_MESSAGE}${NC}"
git commit -m "$COMMIT_MESSAGE"

# Push to GitHub
echo -e "${GREEN}Pushing changes to GitHub...${NC}"
git push origin HEAD

# Check if push was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Documentation updates successfully pushed to GitHub!${NC}"
else
    echo -e "${RED}Failed to push documentation updates to GitHub.${NC}"
    echo -e "${YELLOW}Please check your Git configuration and try again.${NC}"
    exit 1
fi

echo -e "${GREEN}Done!${NC}"