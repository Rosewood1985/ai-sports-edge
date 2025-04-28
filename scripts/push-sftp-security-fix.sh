#!/bin/bash

# Script to commit and push the SFTP security improvements

echo "🔒 Pushing SFTP security improvements to GitHub..."

# Make sure the script is executable
chmod +x scripts/secure-sftp-deploy.sh

# Add the new and modified files
git add scripts/secure-sftp-deploy.sh
git add scripts/README.md
git add docs/sftp-upload-guide.md
git add commit-message-sftp-security.txt

# Commit with the prepared message
git commit -F commit-message-sftp-security.txt

# Push to the current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
git push origin $CURRENT_BRANCH

# Check if push was successful
if [ $? -eq 0 ]; then
  echo "✅ Successfully pushed SFTP security improvements to $CURRENT_BRANCH"
else
  echo "❌ Failed to push changes. Please check for errors and try again."
  echo "   You can manually push with: git push origin $CURRENT_BRANCH"
fi

echo ""
echo "🔍 Next steps:"
echo "1. Update your deployment process to use the new secure script"
echo "2. Set up environment variables in your CI/CD pipeline"
echo "3. Consider generating and using SSH keys for authentication"
echo "4. Remove hardcoded credentials from legacy scripts"