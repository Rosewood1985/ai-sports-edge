#!/bin/bash

# Script to push atomic architecture updates to git
# This script commits and pushes the updated files to the repository

# Set up variables
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="push-atomic-updates-$TIMESTAMP.log"
COMMIT_MESSAGE="Update atomic architecture documentation and to-do files

- Update .roo-todo.md with completed tasks
- Update ai-sports-edge-todo.md with atomic architecture tasks
- Add atomic architecture memory file
- Update documentation"

# Start logging
echo "Starting atomic architecture updates push at $(date)" | tee -a $LOG_FILE
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
git add .roo-todo.md
git add ai-sports-edge-todo.md
git add memory-bank/atomic-architecture-memory.md
git add atomic-architecture-summary.md
git add atomic-migration-plan.md
git add atomic-next-steps.md
git add push-atomic-updates.sh

# Commit changes
echo "Committing changes..." | tee -a $LOG_FILE
git commit -m "$COMMIT_MESSAGE"

# Push changes
echo "Pushing changes..." | tee -a $LOG_FILE
git push -u origin "$CURRENT_BRANCH"

# Final message
echo "----------------------------------------" | tee -a $LOG_FILE
echo "Atomic architecture updates push completed at $(date)" | tee -a $LOG_FILE
echo "See $LOG_FILE for details" | tee -a $LOG_FILE
echo "✅ Push completed successfully" | tee -a $LOG_FILE

# Summary
echo "
Push Summary:

1. Updated files:
   - .roo-todo.md
   - ai-sports-edge-todo.md
   - memory-bank/atomic-architecture-memory.md
   - atomic-architecture-summary.md
   - atomic-migration-plan.md
   - atomic-next-steps.md
   - push-atomic-updates.sh

2. Committed changes with message:
   $COMMIT_MESSAGE

3. Pushed changes to branch:
   $CURRENT_BRANCH
"