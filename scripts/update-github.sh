#!/bin/bash
# Script to update the GitHub repository with all changes

# Navigate to the project root directory
cd /Users/lisadario/Desktop/ai-sports-edge

# Set text colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to display section headers
section() {
    echo -e "\n${BLUE}==== $1 ====${NC}\n"
}

# Parse command line arguments
COMMIT_MESSAGE=""
BRANCH="main"
PUSH=true

while [[ $# -gt 0 ]]; do
    case $1 in
        --message|-m)
            COMMIT_MESSAGE="$2"
            shift 2
            ;;
        --branch|-b)
            BRANCH="$2"
            shift 2
            ;;
        --no-push)
            PUSH=false
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Set default commit message if not provided
if [ -z "$COMMIT_MESSAGE" ]; then
    COMMIT_MESSAGE="Update AI Sports Edge with ML model enhancements and sportsbookreview.com integration"
fi

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}Git is not installed. Please install Git to run this script.${NC}"
    exit 1
fi

# Check if the directory is a git repository
if [ ! -d .git ]; then
    section "Initializing Git Repository"
    git init
    echo -e "${GREEN}Git repository initialized.${NC}"
fi

# Check if the remote origin exists
if ! git remote | grep -q "^origin$"; then
    section "Adding Remote Origin"
    echo -e "${YELLOW}No remote origin found. Please enter the GitHub repository URL:${NC}"
    read -p "GitHub URL: " GITHUB_URL
    git remote add origin "$GITHUB_URL"
    echo -e "${GREEN}Remote origin added: ${YELLOW}$GITHUB_URL${NC}"
fi

# Check current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
    section "Switching to Branch: $BRANCH"
    
    # Check if branch exists
    if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
        # Branch exists, switch to it
        git checkout "$BRANCH"
    else
        # Branch doesn't exist, create and switch
        git checkout -b "$BRANCH"
    fi
    
    echo -e "${GREEN}Switched to branch: ${YELLOW}$BRANCH${NC}"
fi

# Stage all changes
section "Staging Changes"
git add .
echo -e "${GREEN}All changes staged.${NC}"

# Show status
git status

# Commit changes
section "Committing Changes"
git commit -m "$COMMIT_MESSAGE"
echo -e "${GREEN}Changes committed with message: ${YELLOW}$COMMIT_MESSAGE${NC}"

# Push changes if requested
if [ "$PUSH" = true ]; then
    section "Pushing Changes to GitHub"
    git push -u origin "$BRANCH"
    echo -e "${GREEN}Changes pushed to GitHub.${NC}"
fi

section "GitHub Update Completed"
echo -e "${GREEN}The GitHub repository has been updated successfully.${NC}"
echo -e "Branch: ${YELLOW}$BRANCH${NC}"
echo -e "Commit Message: ${YELLOW}$COMMIT_MESSAGE${NC}"

if [ "$PUSH" = true ]; then
    echo -e "\nYou can view your changes on GitHub at:"
    REPO_URL=$(git remote get-url origin | sed 's/\.git$//')
    echo -e "${YELLOW}$REPO_URL/tree/$BRANCH${NC}"
else
    echo -e "\n${YELLOW}Changes were not pushed to GitHub. Use the following command to push:${NC}"
    echo -e "  git push -u origin $BRANCH"
fi