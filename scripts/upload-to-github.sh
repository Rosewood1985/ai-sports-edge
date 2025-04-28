#!/bin/bash

# Script to upload changes to GitHub
# This script will commit and push all changes to the specified branch

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
BRANCH="main"
COMMIT_MESSAGE="Enhanced onboarding experience with accessibility, analytics, and error handling improvements"

# Display script header
echo -e "${YELLOW}=========================================${NC}"
echo -e "${YELLOW}   Upload Changes to GitHub Repository   ${NC}"
echo -e "${YELLOW}=========================================${NC}"
echo

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}Error: git is not installed. Please install git and try again.${NC}"
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --is-inside-work-tree &> /dev/null; then
    echo -e "${RED}Error: Not in a git repository. Please run this script from within a git repository.${NC}"
    exit 1
fi

# Check for uncommitted changes
if [[ -z $(git status -s) ]]; then
    echo -e "${YELLOW}No changes to commit. Exiting.${NC}"
    exit 0
fi

# Display changes to be committed
echo -e "${YELLOW}Changes to be committed:${NC}"
git status -s
echo

# Confirm with user
read -p "Do you want to commit and push these changes? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Operation cancelled by user.${NC}"
    exit 0
fi

# Check if the branch exists
if ! git show-ref --verify --quiet refs/heads/$BRANCH; then
    echo -e "${YELLOW}Branch $BRANCH does not exist. Creating it now.${NC}"
    git checkout -b $BRANCH
else
    # Switch to the branch
    echo -e "${YELLOW}Switching to branch $BRANCH...${NC}"
    git checkout $BRANCH
fi

# Add all changes
echo -e "${YELLOW}Adding all changes...${NC}"
git add .

# Commit changes
echo -e "${YELLOW}Committing changes...${NC}"
git commit -m "$COMMIT_MESSAGE"

# Push changes
echo -e "${YELLOW}Pushing changes to GitHub...${NC}"
git push origin $BRANCH

# Check if push was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Changes successfully pushed to GitHub!${NC}"
else
    echo -e "${RED}Failed to push changes to GitHub. Please check your network connection and repository permissions.${NC}"
    exit 1
fi

# List of files changed
echo -e "${YELLOW}Files changed:${NC}"
git show --name-only --oneline HEAD

echo
echo -e "${GREEN}Operation completed successfully!${NC}"