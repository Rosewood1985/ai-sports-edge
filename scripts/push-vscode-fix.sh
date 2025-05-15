#!/bin/bash

# Script to commit and push the VS Code workspace fix

echo "🔧 Pushing VS Code workspace fix to GitHub..."

# Add the modified files
git add .vscode/
git add ai-sports-edge.code-workspace
git add scripts/reset-vscode-workspace.sh
git add docs/vscode-workspace-fix.md
git add commit-message-vscode-fix.txt

# Commit with the prepared message
git commit -F commit-message-vscode-fix.txt

# Create a tag for the fix
git tag vscode-fix-v1.0

# Push to the current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
git push origin $CURRENT_BRANCH
git push origin vscode-fix-v1.0

# Check if push was successful
if [ $? -eq 0 ]; then
  echo "✅ Successfully pushed VS Code workspace fix to $CURRENT_BRANCH"
  echo "✅ Created and pushed tag: vscode-fix-v1.0"
else
  echo "❌ Failed to push changes. Please check for errors and try again."
  echo "   You can manually push with: git push origin $CURRENT_BRANCH"
fi

echo ""
echo "🔍 To reset VS Code workspace if issues recur:"
echo "   ./scripts/reset-vscode-workspace.sh"
echo ""
echo "📋 Documentation available at: docs/vscode-workspace-fix.md"