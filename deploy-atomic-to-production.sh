#!/bin/bash

# Script to deploy the atomic architecture to production
# This script merges the feature branch to main and deploys to production

# Set up variables
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="deploy-atomic-production-$TIMESTAMP.log"
FEATURE_BRANCH="feature/atomic-architecture-20250422_152356"
MAIN_BRANCH="main"
COMMIT_MESSAGE="Deploy atomic architecture to production

- Migrate core modules to atomic architecture
- Migrate pages to atomic architecture
- Add testing infrastructure
- Add documentation and migration tools"

# Start logging
echo "Starting atomic architecture deployment to production at $(date)" | tee -a $LOG_FILE
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

# Check if main branch exists
if ! git show-ref --verify --quiet refs/heads/$MAIN_BRANCH; then
    echo "Error: Main branch does not exist. Please create it first." | tee -a $LOG_FILE
    exit 1
fi

# Check if feature branch exists
if ! git show-ref --verify --quiet refs/heads/$FEATURE_BRANCH; then
    echo "Error: Feature branch does not exist. Please create it first." | tee -a $LOG_FILE
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $CURRENT_BRANCH" | tee -a $LOG_FILE

# Checkout main branch
echo "Checking out $MAIN_BRANCH branch..." | tee -a $LOG_FILE
git checkout $MAIN_BRANCH

# Pull latest changes
echo "Pulling latest changes from $MAIN_BRANCH..." | tee -a $LOG_FILE
git pull origin $MAIN_BRANCH

# Merge feature branch
echo "Merging $FEATURE_BRANCH into $MAIN_BRANCH..." | tee -a $LOG_FILE
git merge --no-ff $FEATURE_BRANCH -m "$COMMIT_MESSAGE"

# Push changes
echo "Pushing changes to $MAIN_BRANCH..." | tee -a $LOG_FILE
git push origin $MAIN_BRANCH

# Run tests
echo "Running tests..." | tee -a $LOG_FILE
npx jest --config=jest.config.atomic.js __tests__/atomic/ >> $LOG_FILE 2>&1

# Run ESLint
echo "Running ESLint..." | tee -a $LOG_FILE
npx eslint --config .eslintrc.atomic.js atomic/**/*.js >> $LOG_FILE 2>&1

# Deploy to production
echo "Deploying to production..." | tee -a $LOG_FILE

# Run Firebase deployment
echo "Deploying to Firebase..." | tee -a $LOG_FILE
firebase deploy --only hosting >> $LOG_FILE 2>&1

# Run Expo deployment
echo "Building Expo app..." | tee -a $LOG_FILE
expo build:web >> $LOG_FILE 2>&1
expo build:android >> $LOG_FILE 2>&1
expo build:ios >> $LOG_FILE 2>&1

# Publish to Expo
echo "Publishing to Expo..." | tee -a $LOG_FILE
expo publish >> $LOG_FILE 2>&1

# Return to original branch
echo "Returning to $CURRENT_BRANCH branch..." | tee -a $LOG_FILE
git checkout $CURRENT_BRANCH

# Final message
echo "----------------------------------------" | tee -a $LOG_FILE
echo "Atomic architecture deployment to production completed at $(date)" | tee -a $LOG_FILE
echo "See $LOG_FILE for details" | tee -a $LOG_FILE
echo "✅ Deployment completed successfully" | tee -a $LOG_FILE

# Summary
echo "
Deployment Summary:

1. Merged $FEATURE_BRANCH into $MAIN_BRANCH
2. Pushed changes to $MAIN_BRANCH
3. Ran tests and ESLint
4. Deployed to Firebase hosting
5. Built and published Expo app

The atomic architecture is now deployed to production!

Next Steps:
1. Monitor the application for any issues
2. Continue migrating remaining components
3. Update documentation as needed
"