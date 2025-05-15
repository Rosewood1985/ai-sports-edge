#!/bin/bash

# Script to push implement-atomic-architecture.sh to git
# This script commits and pushes the implement-atomic-architecture.sh script to the repository

# Set up variables
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="push-implement-script-$TIMESTAMP.log"
COMMIT_MESSAGE="Add script for implementing atomic architecture in main codebase

- Add script for updating configuration files
- Add script for updating application files
- Add script for creating implementation plan"

# Start logging
echo "Starting implement script push at $(date)" | tee -a $LOG_FILE
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
git add implement-atomic-architecture.sh
git add push-implement-script.sh

# Commit changes
echo "Committing changes..." | tee -a $LOG_FILE
git commit -m "$COMMIT_MESSAGE"

# Push changes
echo "Pushing changes..." | tee -a $LOG_FILE
git push -u origin "$CURRENT_BRANCH"

# Final message
echo "----------------------------------------" | tee -a $LOG_FILE
echo "Implement script push completed at $(date)" | tee -a $LOG_FILE
echo "See $LOG_FILE for details" | tee -a $LOG_FILE
echo "✅ Push completed successfully" | tee -a $LOG_FILE

# Summary
echo "
Push Summary:

1. Updated files:
   - implement-atomic-architecture.sh
   - push-implement-script.sh

2. Committed changes with message:
   $COMMIT_MESSAGE

3. Pushed changes to branch:
   $CURRENT_BRANCH

The atomic architecture implementation script is now ready to use!
Next steps:
1. Run './implement-atomic-architecture.sh' to implement the atomic architecture in the main codebase
2. Test the implementation
3. Fix any issues
4. Deploy to production

Run './complete-atomic-project.sh' to finalize the migration with a pull request to main.
"