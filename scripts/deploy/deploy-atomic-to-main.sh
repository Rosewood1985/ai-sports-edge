#!/bin/bash

# Script to deploy the atomic architecture to the main branch
# This script creates a pull request and merges it to the main branch

# Set up variables
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="deploy-atomic-main-$TIMESTAMP.log"
BRANCH_NAME="feature/atomic-architecture-$TIMESTAMP"
COMMIT_MESSAGE="Deploy atomic architecture to main branch

- Complete atomic architecture implementation
- Add migration tools and documentation
- Add testing infrastructure
- Add ESLint configuration"

# Start logging
echo "Starting atomic architecture deployment to main branch at $(date)" | tee -a $LOG_FILE
echo "----------------------------------------" | tee -a $LOG_FILE

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "Error: git is not installed. Please install git and try again." | tee -a $LOG_FILE
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --is-inside-work-tree &> /dev/null; then
    echo "Error: Not in a git repository. Please run this script from within a git repository." | tee -a $LOG_FILE
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "There are uncommitted changes in the repository." | tee -a $LOG_FILE
    echo "Do you want to continue? (y/n)" | tee -a $LOG_FILE
    read -r response
    if [[ "$response" != "y" ]]; then
        echo "Aborting." | tee -a $LOG_FILE
        exit 1
    fi
fi

# Check if main branch exists
if ! git show-ref --verify --quiet refs/heads/main; then
    echo "Main branch does not exist. Using master branch instead." | tee -a $LOG_FILE
    MAIN_BRANCH="master"
else
    MAIN_BRANCH="main"
fi

# Check if we're on the main branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$CURRENT_BRANCH" == "$MAIN_BRANCH" ]]; then
    echo "You are currently on the $MAIN_BRANCH branch." | tee -a $LOG_FILE
    echo "Do you want to create a new branch for deployment? (y/n)" | tee -a $LOG_FILE
    read -r response
    if [[ "$response" == "y" ]]; then
        echo "Creating new branch: $BRANCH_NAME" | tee -a $LOG_FILE
        git checkout -b "$BRANCH_NAME"
    else
        echo "Continuing with $MAIN_BRANCH branch." | tee -a $LOG_FILE
        BRANCH_NAME="$MAIN_BRANCH"
    fi
else
    echo "You are currently on the $CURRENT_BRANCH branch." | tee -a $LOG_FILE
    echo "Do you want to create a new branch for deployment? (y/n)" | tee -a $LOG_FILE
    read -r response
    if [[ "$response" == "y" ]]; then
        echo "Creating new branch: $BRANCH_NAME" | tee -a $LOG_FILE
        git checkout -b "$BRANCH_NAME"
    else
        echo "Continuing with $CURRENT_BRANCH branch." | tee -a $LOG_FILE
        BRANCH_NAME="$CURRENT_BRANCH"
    fi
fi

# Run tests
echo "Running tests..." | tee -a $LOG_FILE
npx jest --config=jest.config.atomic.js >> $LOG_FILE 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Tests passed" | tee -a $LOG_FILE
else
    echo "❌ Tests failed. See $LOG_FILE for details" | tee -a $LOG_FILE
    echo "Do you want to continue with deployment? (y/n)" | tee -a $LOG_FILE
    read -r response
    if [[ "$response" != "y" ]]; then
        echo "Aborting." | tee -a $LOG_FILE
        exit 1
    fi
fi

# Run ESLint
echo "Running ESLint..." | tee -a $LOG_FILE
npx eslint --config .eslintrc.atomic.js atomic/**/*.js >> $LOG_FILE 2>&1
if [ $? -eq 0 ]; then
    echo "✅ ESLint passed" | tee -a $LOG_FILE
else
    echo "❌ ESLint failed. See $LOG_FILE for details" | tee -a $LOG_FILE
    echo "Do you want to continue with deployment? (y/n)" | tee -a $LOG_FILE
    read -r response
    if [[ "$response" != "y" ]]; then
        echo "Aborting." | tee -a $LOG_FILE
        exit 1
    fi
fi

# Add files
echo "Adding files..." | tee -a $LOG_FILE
git add atomic/
git add __tests__/atomic/
git add jest.config.atomic.js
git add jest.setup.atomic.js
git add deploy-atomic.sh
git add cleanup-atomic.sh
git add complete-atomic-migration.sh
git add atomic-architecture-summary.md
git add atomic-next-steps.md
git add atomic-migration-plan.md
git add .eslintrc.atomic.js
git add deploy-atomic-to-main.sh

# Commit changes
echo "Committing changes..." | tee -a $LOG_FILE
git commit -m "$COMMIT_MESSAGE"

# Push changes
echo "Pushing changes..." | tee -a $LOG_FILE
git push -u origin "$BRANCH_NAME"

# Create pull request
if [[ "$BRANCH_NAME" != "$MAIN_BRANCH" ]]; then
    echo "Creating pull request..." | tee -a $LOG_FILE
    echo "Please create a pull request on GitHub:" | tee -a $LOG_FILE
    echo "https://github.com/Rosewood1985/ai-sports-edge/pull/new/$BRANCH_NAME" | tee -a $LOG_FILE
    
    echo "Do you want to merge the pull request now? (y/n)" | tee -a $LOG_FILE
    read -r response
    if [[ "$response" == "y" ]]; then
        echo "Merging pull request..." | tee -a $LOG_FILE
        git checkout "$MAIN_BRANCH"
        git pull
        git merge --no-ff "$BRANCH_NAME" -m "Merge $BRANCH_NAME into $MAIN_BRANCH"
        git push
        echo "✅ Pull request merged" | tee -a $LOG_FILE
    else
        echo "Pull request not merged. Please merge it manually." | tee -a $LOG_FILE
    fi
fi

# Final message
echo "----------------------------------------" | tee -a $LOG_FILE
echo "Atomic architecture deployment to main branch completed at $(date)" | tee -a $LOG_FILE
echo "See $LOG_FILE for details" | tee -a $LOG_FILE
echo "✅ Deployment completed successfully" | tee -a $LOG_FILE

# Make the script executable
chmod +x deploy-atomic-to-main.sh

# Summary
echo "
Deployment Summary:

1. Created branch: $BRANCH_NAME
2. Added atomic architecture files
3. Committed changes
4. Pushed changes to remote repository

Next Steps:

1. Create a pull request on GitHub:
   https://github.com/Rosewood1985/ai-sports-edge/pull/new/$BRANCH_NAME

2. Review the pull request

3. Merge the pull request to the main branch

4. Start using the atomic architecture in your project
"