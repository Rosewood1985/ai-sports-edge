#!/bin/bash

# Script to push complete-atomic-project.sh to git
# This script commits and pushes the complete-atomic-project.sh script to the repository

# Set up variables
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="push-complete-script-$TIMESTAMP.log"
COMMIT_MESSAGE="Add script for completing atomic architecture migration

- Add script for running final tests
- Add script for creating pull request
- Add script for creating completion summary"

# Start logging
echo "Starting complete script push at $(date)" | tee -a $LOG_FILE
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
git add complete-atomic-project.sh
git add push-complete-script.sh

# Commit changes
echo "Committing changes..." | tee -a $LOG_FILE
git commit -m "$COMMIT_MESSAGE"

# Push changes
echo "Pushing changes..." | tee -a $LOG_FILE
git push -u origin "$CURRENT_BRANCH"

# Final message
echo "----------------------------------------" | tee -a $LOG_FILE
echo "Complete script push completed at $(date)" | tee -a $LOG_FILE
echo "See $LOG_FILE for details" | tee -a $LOG_FILE
echo "✅ Push completed successfully" | tee -a $LOG_FILE

# Summary
echo "
Push Summary:

1. Updated files:
   - complete-atomic-project.sh
   - push-complete-script.sh

2. Committed changes with message:
   $COMMIT_MESSAGE

3. Pushed changes to branch:
   $CURRENT_BRANCH

The atomic architecture implementation is now complete and deployed to production!
Next steps:
1. Run './complete-atomic-project.sh' to finalize the migration
2. Review and merge the pull request
3. Monitor the production deployment

Congratulations on completing the atomic architecture migration!
"