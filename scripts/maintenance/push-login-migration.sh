#!/bin/bash

# Script to push LoginScreen migration to git
# This script commits and pushes the LoginScreen migration to the repository

# Set up variables
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="push-login-migration-$TIMESTAMP.log"
COMMIT_MESSAGE="Migrate LoginScreen to atomic architecture

- Add LoginScreen component to atomic/pages
- Add LoginScreen tests
- Update pages index
- Update to-do files"

# Start logging
echo "Starting LoginScreen migration push at $(date)" | tee -a $LOG_FILE
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

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $CURRENT_BRANCH" | tee -a $LOG_FILE

# Add files
echo "Adding files..." | tee -a $LOG_FILE
git add atomic/pages/LoginScreen.js
git add atomic/pages/index.js
git add __tests__/atomic/pages/LoginScreen.test.js
git add ai-sports-edge-todo.md
git add push-login-migration.sh

# Commit changes
echo "Committing changes..." | tee -a $LOG_FILE
git commit -m "$COMMIT_MESSAGE"

# Push changes
echo "Pushing changes..." | tee -a $LOG_FILE
git push -u origin "$CURRENT_BRANCH"

# Final message
echo "----------------------------------------" | tee -a $LOG_FILE
echo "LoginScreen migration push completed at $(date)" | tee -a $LOG_FILE
echo "See $LOG_FILE for details" | tee -a $LOG_FILE
echo "✅ Push completed successfully" | tee -a $LOG_FILE

# Summary
echo "
Push Summary:

1. Updated files:
   - atomic/pages/LoginScreen.js
   - atomic/pages/index.js
   - __tests__/atomic/pages/LoginScreen.test.js
   - ai-sports-edge-todo.md
   - push-login-migration.sh

2. Committed changes with message:
   $COMMIT_MESSAGE

3. Pushed changes to branch:
   $CURRENT_BRANCH
"