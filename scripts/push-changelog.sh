#!/bin/bash

# Script to commit and push the CHANGELOG.md

echo "📝 Pushing CHANGELOG.md to GitHub..."

# Add the CHANGELOG.md file
git add CHANGELOG.md

# Commit with the prepared message
git commit -F commit-message-changelog.txt

# Push to the current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
git push origin $CURRENT_BRANCH

# Check if push was successful
if [ $? -eq 0 ]; then
  echo "✅ Successfully pushed CHANGELOG.md to $CURRENT_BRANCH"
else
  echo "❌ Failed to push changes. Please check for errors and try again."
  echo "   You can manually push with: git push origin $CURRENT_BRANCH"
fi

echo ""
echo "🔍 Next steps:"
echo "1. Tag the release: git tag v1.0"
echo "2. Push the tag: git push origin v1.0"
echo "3. Create a release on GitHub with the CHANGELOG.md content"