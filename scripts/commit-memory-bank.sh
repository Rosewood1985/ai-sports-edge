#!/bin/bash
# commit-memory-bank.sh - Commit the memory bank system to the repository

set -e

echo "Committing memory bank system to repository..."

# Check if there are any uncommitted changes
if [ -z "$(git status --porcelain)" ]; then
  echo "No changes to commit. Exiting."
  exit 0
fi

# Stage the memory bank files
git add .roocode/memory_bank.md
git add .roocode/README.md
git add .roocode/activity_logs/
git add scripts/memory_bank.sh
git add scripts/new_file.sh
git add scripts/detect_duplicates.sh
git add scripts/smart_logger.sh
git add docs/memory-bank-system.md
git add reports/
git add .git/hooks/pre-commit
git add .git/hooks/post-commit
git add scripts/git_workflow_helper.sh
git add commit-message-memory-bank.txt

# Use the commit message from the file
git commit -F commit-message-memory-bank.txt

echo "Memory bank system committed successfully!"
echo "To push the changes, run: git push origin $(git rev-parse --abbrev-ref HEAD)"