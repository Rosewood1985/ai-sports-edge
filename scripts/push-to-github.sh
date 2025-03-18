#!/bin/bash
# Script to push AI Sports Edge changes to GitHub

# Set variables
GITHUB_REPO="https://github.com/ai-sports-edge/ai-sports-edge.git"
BRANCH_NAME="main"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Pushing changes to GitHub repository...${NC}"

# Check if git is installed
if ! command -v git &> /dev/null; then
  echo -e "${RED}Git is not installed. Please install git and try again.${NC}"
  exit 1
fi

# Check if the directory is a git repository
if [ ! -d ".git" ]; then
  echo -e "${YELLOW}Initializing git repository...${NC}"
  git init
  
  # Add the remote repository
  echo -e "${YELLOW}Adding remote repository...${NC}"
  git remote add origin $GITHUB_REPO
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to add remote repository. Aborting.${NC}"
    exit 1
  fi
else
  # Check if the remote repository is already set
  REMOTE_URL=$(git remote get-url origin 2>/dev/null)
  
  if [ $? -ne 0 ] || [ "$REMOTE_URL" != "$GITHUB_REPO" ]; then
    echo -e "${YELLOW}Setting remote repository...${NC}"
    git remote remove origin 2>/dev/null
    git remote add origin $GITHUB_REPO
    
    if [ $? -ne 0 ]; then
      echo -e "${RED}Failed to set remote repository. Aborting.${NC}"
      exit 1
    fi
  fi
fi

# Create .gitignore file if it doesn't exist
if [ ! -f ".gitignore" ]; then
  echo -e "${YELLOW}Creating .gitignore file...${NC}"
  cat > .gitignore << EOF
# Node.js
node_modules/
npm-debug.log
yarn-debug.log
yarn-error.log
.pnpm-debug.log
.npm

# Build files
/build
/dist
/.next
/out

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE files
.idea/
.vscode/
*.swp
*.swo
.DS_Store

# Logs
logs
*.log

# Testing
/coverage

# Dependency directories
/.pnp
.pnp.js

# Misc
.DS_Store
Thumbs.db
EOF
fi

# Stage all changes
echo -e "${YELLOW}Staging changes...${NC}"
git add .

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to stage changes. Aborting.${NC}"
  exit 1
fi

# Commit changes
echo -e "${YELLOW}Committing changes...${NC}"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
git commit -m "Deploy update: $TIMESTAMP"

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to commit changes. Aborting.${NC}"
  exit 1
fi

# Check if the branch exists
BRANCH_EXISTS=$(git branch --list $BRANCH_NAME)

if [ -z "$BRANCH_EXISTS" ]; then
  echo -e "${YELLOW}Creating branch $BRANCH_NAME...${NC}"
  git branch $BRANCH_NAME
fi

# Switch to the branch
echo -e "${YELLOW}Switching to branch $BRANCH_NAME...${NC}"
git checkout $BRANCH_NAME

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to switch to branch $BRANCH_NAME. Aborting.${NC}"
  exit 1
fi

# Push changes to GitHub
echo -e "${YELLOW}Pushing changes to GitHub...${NC}"
git push -u origin $BRANCH_NAME

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to push changes to GitHub. Aborting.${NC}"
  exit 1
fi

echo -e "${GREEN}Changes successfully pushed to GitHub repository!${NC}"