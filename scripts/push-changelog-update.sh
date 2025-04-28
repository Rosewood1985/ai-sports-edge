#!/bin/bash

# Script to commit and push the CHANGELOG update

echo "📝 Pushing CHANGELOG update to GitHub..."

# Add the modified files
git add CHANGELOG.md
git add commit-message-changelog-update.txt
git add docs/deployment-health-check.md

# Commit with the prepared message
git commit -F commit-message-changelog-update.txt

# Create a tag for the update
git tag changelog-update-v1.0

# Push to the current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
git push origin $CURRENT_BRANCH
git push origin changelog-update-v1.0

# Check if push was successful
if [ $? -eq 0 ]; then
  echo "✅ Successfully pushed CHANGELOG update to $CURRENT_BRANCH"
  echo "✅ Created and pushed tag: changelog-update-v1.0"
else
  echo "❌ Failed to push changes. Please check for errors and try again."
  echo "   You can manually push with: git push origin $CURRENT_BRANCH"
fi

echo ""
echo "🔍 CHANGELOG now includes deployment health check details"