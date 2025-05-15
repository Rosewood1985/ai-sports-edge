#!/bin/bash

# Script to commit and push the deployment fixes

echo "🔒 Pushing deployment fixes to GitHub..."

# Add the new and modified files
git add dist/index.html
git add dist/.htaccess
git add commit-message-deployment-fixes.txt

# Commit with the prepared message
git commit -F commit-message-deployment-fixes.txt

# Push to the current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
git push origin $CURRENT_BRANCH

# Check if push was successful
if [ $? -eq 0 ]; then
  echo "✅ Successfully pushed deployment fixes to $CURRENT_BRANCH"
else
  echo "❌ Failed to push changes. Please check for errors and try again."
  echo "   You can manually push with: git push origin $CURRENT_BRANCH"
fi

echo ""
echo "🔍 Post-deployment verification checklist:"
echo "1. Visit https://aisportsedge.app in incognito or hard refresh"
echo "2. Ensure no reload loop"
echo "3. Ensure no integrity, MIME, or CSP errors in Console"
echo "4. Confirm Firebase and routing work as expected"
echo "5. Verify language toggle works and Spanish text appears when selected"