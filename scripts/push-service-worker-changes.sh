#!/bin/bash

# Script to push service worker changes to git
# Created as part of service worker disabling

echo "🚀 Pushing service worker changes to git..."

# Add the modified files
echo "Adding files to git..."
git add dist/register-service-worker.js
git add dist/service-worker.js

# Commit changes using the commit message
echo "Committing changes..."
git commit -F commit-message-sw.txt

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
echo "🎉 Service worker disabled and changes pushed to git!"
exit 0