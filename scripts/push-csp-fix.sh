#!/bin/bash

# Script to push CSP and integrity attribute fixes to git
# Created as part of CSP and integrity attribute fixes

echo "🚀 Pushing CSP and integrity attribute fixes to git..."

# Add the modified file
echo "Adding files to git..."
git add dist/index.html

# Commit changes using the commit message
echo "Committing changes..."
git commit -F commit-message-csp.txt

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
echo "🎉 CSP and integrity attribute fixes complete and pushed to git!"
exit 0