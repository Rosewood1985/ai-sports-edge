#!/bin/bash

# Script to commit and push the fixed public URL and deployment script

echo "🔒 Pushing fixed public URL and deployment script to GitHub..."

# Add the modified files
git add scripts/deploy-fixed-public-url.sh
git add commit-message-fixed-public-url.txt
git add package.json  # This will be modified by the deployment script

# Commit with the prepared message
git commit -F commit-message-fixed-public-url.txt

# Create a tag for the fix
git tag fixed-public-url-v1.0

# Push to the current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
git push origin $CURRENT_BRANCH
git push origin fixed-public-url-v1.0

# Check if push was successful
if [ $? -eq 0 ]; then
  echo "✅ Successfully pushed fixed public URL to $CURRENT_BRANCH"
  echo "✅ Created and pushed tag: fixed-public-url-v1.0"
else
  echo "❌ Failed to push changes. Please check for errors and try again."
  echo "   You can manually push with: git push origin $CURRENT_BRANCH"
fi

echo ""
echo "🔍 Post-deployment verification checklist:"
echo "1. Visit https://aisportsedge.app in incognito or hard refresh"
echo "2. Ensure no reload loop"
echo "3. Ensure no integrity, MIME, or CSP errors in Console"
echo "4. Confirm static assets load with 200 OK status"
echo "5. Verify Firebase authentication works"
echo "6. Test language toggle functionality"