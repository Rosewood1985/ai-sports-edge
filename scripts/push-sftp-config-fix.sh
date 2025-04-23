#!/bin/bash

# Script to push SFTP configuration fixes to the repository

# Set script to exit on error
set -e

# Display what's being committed
echo "Committing SFTP configuration fixes..."

# Stage the modified files
git add .vscode/sftp.json
git add .vscode/settings.json
git add vscode-sftp-deploy/.vscode/sftp.json
git add CHANGELOG.md
git add commit-message-sftp-config-fix.txt
git add scripts/push-sftp-config-fix.sh

# Commit with the prepared message
git commit -F commit-message-sftp-config-fix.txt

# Push to the repository
echo "Pushing changes to repository..."
git push

echo "SFTP configuration fixes have been pushed successfully!"
echo "Please restart VS Code for the changes to take effect."