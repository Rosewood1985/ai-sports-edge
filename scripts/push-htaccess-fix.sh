#!/bin/bash

# Script to commit and push the .htaccess fix

echo "🔒 Pushing .htaccess fix to GitHub..."

# Add the modified files
git add dist/.htaccess
git add dist/index.html
git add scripts/deploy-with-htaccess.sh
git add commit-message-htaccess-fix.txt

# Commit with the prepared message
git commit -F commit-message-htaccess-fix.txt

# Create a tag for the fix
git tag htaccess-fix-v1.0

# Push to the current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
git push origin $CURRENT_BRANCH
git push origin htaccess-fix-v1.0

# Check if push was successful
if [ $? -eq 0 ]; then
  echo "✅ Successfully pushed .htaccess fix to $CURRENT_BRANCH"
  echo "✅ Created and pushed tag: htaccess-fix-v1.0"
else
  echo "❌ Failed to push changes. Please check for errors and try again."
  echo "   You can manually push with: git push origin $CURRENT_BRANCH"
fi

echo ""
echo "🔍 Post-deployment verification checklist:"
echo "1. Visit https://aisportsedge.app in incognito or hard refresh"
echo "2. Ensure no reload loop"
echo "3. Ensure no integrity, MIME, or CSP errors in Console"
echo "4. Confirm Firebase authentication works"
echo "5. Verify language toggle works and Spanish text appears when selected"