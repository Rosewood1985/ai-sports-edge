#!/bin/bash

# Script to push X-Frame-Options fix to git
# Created as part of X-Frame-Options fix

echo "🚀 Pushing X-Frame-Options fix to git..."

# Add the modified file
echo "Adding files to git..."
git add dist/index.html

# Commit changes using the commit message
echo "Committing changes..."
git commit -F commit-message-xframe.txt

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
echo "🎉 X-Frame-Options fix complete and pushed to git!"
exit 0