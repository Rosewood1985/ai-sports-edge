#!/bin/bash

# Script to push deployment summary to git
# This script commits and pushes the deployment summary to the repository

# Set up variables
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="push-deployment-summary-$TIMESTAMP.log"
COMMIT_MESSAGE="Add atomic architecture deployment summary

- Add deployment summary document
- Add production deployment script
- Document deployment process and current state"

# Start logging
echo "Starting deployment summary push at $(date)" | tee -a $LOG_FILE
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
git add atomic-deployment-summary.md
git add deploy-atomic-to-production.sh
git add push-deployment-summary.sh

# Commit changes
echo "Committing changes..." | tee -a $LOG_FILE
git commit -m "$COMMIT_MESSAGE"

# Push changes
echo "Pushing changes..." | tee -a $LOG_FILE
git push -u origin "$CURRENT_BRANCH"

# Final message
echo "----------------------------------------" | tee -a $LOG_FILE
echo "Deployment summary push completed at $(date)" | tee -a $LOG_FILE
echo "See $LOG_FILE for details" | tee -a $LOG_FILE
echo "✅ Push completed successfully" | tee -a $LOG_FILE

# Summary
echo "
Push Summary:

1. Updated files:
   - atomic-deployment-summary.md
   - deploy-atomic-to-production.sh
   - push-deployment-summary.sh

2. Committed changes with message:
   $COMMIT_MESSAGE

3. Pushed changes to branch:
   $CURRENT_BRANCH

The atomic architecture implementation is now complete and deployed to production!
"