#!/bin/bash

# Script to commit and push frontend blocker fixes

echo "🔧 Pushing frontend blocker fixes to GitHub..."

# Add the modified files
git add dist/.htaccess
git add dist/index.html
git add dist/login.html
git add dist/homepage-preview.html
git add dist/firebase-config.js
git add commit-message-frontend-blockers.txt

# Commit with the prepared message
git commit -F commit-message-frontend-blockers.txt

# Push to the current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
git push origin $CURRENT_BRANCH

# Check if push was successful
if [ $? -eq 0 ]; then
  echo "✅ Successfully pushed frontend blocker fixes to $CURRENT_BRANCH"
else
  echo "❌ Failed to push changes. Please check for errors and try again."
  echo "   You can manually push with: git push origin $CURRENT_BRANCH"
fi

# Deploy the changes using the secure SFTP deploy script
echo ""
echo "🚀 Deploying changes to production..."
./scripts/secure-sftp-deploy.sh

echo ""
echo "📋 Summary of changes:"
echo "- Removed X-Frame-Options meta tag from HTML files"
echo "- Set X-Frame-Options via .htaccess instead"
echo "- Fixed Google Fonts by adding proper crossorigin attribute"
echo "- Resolved Firebase MIME issues with firebase-config.js"
echo "- Updated Content Security Policy in .htaccess"
echo "- Added proper MIME types for .mjs and .json files"
echo "- Centralized Firebase config in a single file"
echo ""
echo "These changes should resolve all frontend blocking issues."