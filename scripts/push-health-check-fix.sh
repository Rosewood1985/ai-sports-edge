#!/bin/bash

# Script to commit and push the health check script fix

echo "🔧 Pushing health check script fix to GitHub..."

# Add the modified files
git add scripts/verify-deployment-health.sh
git add commit-message-health-check-fix.txt

# Commit with the prepared message
git commit -F commit-message-health-check-fix.txt

# Create a tag for the fix
git tag health-check-fix-v1.0

# Push to the current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
git push origin $CURRENT_BRANCH
git push origin health-check-fix-v1.0

# Check if push was successful
if [ $? -eq 0 ]; then
  echo "✅ Successfully pushed health check script fix to $CURRENT_BRANCH"
  echo "✅ Created and pushed tag: health-check-fix-v1.0"
else
  echo "❌ Failed to push changes. Please check for errors and try again."
  echo "   You can manually push with: git push origin $CURRENT_BRANCH"
fi

echo ""
echo "🔍 To run the health check script:"
echo "   ./scripts/verify-deployment-health.sh"
echo ""
echo "📊 The script will generate a report in ./health-report/"