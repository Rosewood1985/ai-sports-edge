#!/bin/bash

# Script to commit and push the reset-web-deploy script

echo "🔧 Pushing reset-web-deploy script to GitHub..."

# Add the modified files
git add scripts/reset-web-deploy.sh
git add commit-message-reset-deploy.txt

# Commit with the prepared message
git commit -F commit-message-reset-deploy.txt

# Push to the current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
git push origin $CURRENT_BRANCH

# Check if push was successful
if [ $? -eq 0 ]; then
  echo "✅ Successfully pushed reset-web-deploy script to $CURRENT_BRANCH"
else
  echo "❌ Failed to push changes. Please check for errors and try again."
  echo "   You can manually push with: git push origin $CURRENT_BRANCH"
fi

echo ""
echo "🚀 To reset and redeploy the production site:"
echo "   ./scripts/reset-web-deploy.sh"
echo ""
echo "📋 This script will:"
echo "1. Clean the remote directory (preserving .htaccess and logo)"
echo "2. Upload all files from the dist directory"
echo "3. Update .htaccess with proper security headers"
echo "4. Run post-deployment verification"
echo ""
echo "⚠️ Make sure to run 'npx expo export --platform web' first to generate the dist directory"