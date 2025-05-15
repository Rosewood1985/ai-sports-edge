#!/bin/bash

# Script to push SFTP configuration standardization changes to git
# Created as part of SFTP config standardization

echo "🚀 Pushing SFTP configuration standardization changes to git..."

# Add all modified and new files
echo "Adding files to git..."
git add vscode-sftp-deploy/.vscode/sftp.json
git add scripts/check-sftp-configs.sh
git add scripts/check-sftp-sync.sh
git add scripts/sftp-deploy-cleanup.sh
git add scripts/pre-deploy-checks.sh
git add scripts/quick-deploy.sh
git add scripts/deployment-checklist.sh
git add docs/sftp-deployment.md
git add .roo-todo.md
git add memory-bank/sftp-deployment-standardization.md

# Commit changes using the commit message
echo "Committing changes..."
git commit -F commit-message.txt

# Push changes to remote repository
echo "Pushing changes to remote repository..."
git push origin main

if [ $? -eq 0 ]; then
  echo "✅ Changes pushed successfully!"
else
  echo "⚠️  Failed to push changes. Please check git status and try again."
  exit 1
fi

echo ""
echo "🎉 SFTP configuration standardization complete and pushed to git!"
exit 0