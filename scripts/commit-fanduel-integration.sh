#!/bin/bash

# Script to commit and push FanDuel affiliate integration changes to GitHub

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting FanDuel affiliate integration commit process...${NC}"

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}Error: git is not installed. Please install git and try again.${NC}"
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --is-inside-work-tree &> /dev/null; then
    echo -e "${RED}Error: Not in a git repository. Please run this script from within your git repository.${NC}"
    exit 1
fi

# Create a new branch for the FanDuel affiliate integration
BRANCH_NAME="feature/fanduel-affiliate-integration"
echo -e "${YELLOW}Creating new branch: ${BRANCH_NAME}${NC}"

# Check if branch already exists
if git show-ref --verify --quiet refs/heads/${BRANCH_NAME}; then
    echo -e "${YELLOW}Branch ${BRANCH_NAME} already exists. Checking it out...${NC}"
    git checkout ${BRANCH_NAME}
else
    echo -e "${YELLOW}Creating and checking out new branch: ${BRANCH_NAME}${NC}"
    git checkout -b ${BRANCH_NAME}
fi

# List of files to add
FILES_TO_ADD=(
    "components/BetNowButton.tsx"
    "components/BetNowPopup.tsx"
    "contexts/BettingAffiliateContext.tsx"
    "services/bettingAffiliateService.ts"
    "services/abTestingService.ts"
    "services/gameUrlService.ts"
    "docs/fanduel-affiliate-ab-testing.md"
    "docs/fanduel-game-url-integration.md"
    "config/teamColors.ts"
    "App.tsx"
    "web/components/BetNowButton.js"
    "web/components/BetNowPopup.js"
)

# Add all files
echo -e "${YELLOW}Adding files to git...${NC}"
for file in "${FILES_TO_ADD[@]}"; do
    if [ -f "$file" ]; then
        git add "$file"
        echo -e "${GREEN}Added: $file${NC}"
    else
        echo -e "${RED}Warning: $file not found, skipping${NC}"
    fi
done

# Commit the changes
COMMIT_MESSAGE="Add FanDuel affiliate integration with A/B testing and game URL integration

This commit includes:
- BetNowButton and BetNowPopup components for web and mobile
- BettingAffiliateContext for app-wide affiliate functionality
- A/B testing framework with Firebase Remote Config integration
- GameUrlService for automatic game URL fetching from sports APIs
- Comprehensive documentation for the implementation"

echo -e "${YELLOW}Committing changes...${NC}"
git commit -m "$COMMIT_MESSAGE"

# Push to GitHub
echo -e "${YELLOW}Pushing to GitHub...${NC}"
git push -u origin ${BRANCH_NAME}

echo -e "${GREEN}FanDuel affiliate integration successfully committed and pushed to GitHub!${NC}"
echo -e "${GREEN}Branch: ${BRANCH_NAME}${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Create a pull request on GitHub to merge this branch into main"
echo -e "2. Review the changes and address any feedback"
echo -e "3. Merge the pull request once approved"