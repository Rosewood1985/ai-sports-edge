#!/bin/bash
# Create a branch for the analysis tools feature
# This script creates a new branch for the analysis tools feature and commits the changes.

set -e  # Exit on error

BRANCH_NAME="feature/analysis-tools"
COMMIT_MESSAGE=$(cat commit-message-analysis-tools.txt)

echo "🔄 Creating branch for analysis tools feature"
echo "============================================="
echo ""

# Check if git is available
if ! command -v git &> /dev/null; then
  echo "❌ Git is not installed or not in PATH"
  exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --is-inside-work-tree &> /dev/null; then
  echo "❌ Not in a git repository"
  exit 1
fi

# Check if the branch already exists
if git show-ref --verify --quiet refs/heads/$BRANCH_NAME; then
  echo "⚠️ Branch $BRANCH_NAME already exists"
  read -p "Do you want to use the existing branch? (y/n) " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Aborting"
    exit 1
  fi
  
  # Checkout the existing branch
  git checkout $BRANCH_NAME
  echo "✅ Switched to existing branch $BRANCH_NAME"
else
  # Create a new branch
  git checkout -b $BRANCH_NAME
  echo "✅ Created and switched to new branch $BRANCH_NAME"
fi

# Run the setup script
echo ""
echo "🔧 Running setup script"
./scripts/setup-roocode-structure.sh

# Check if package.json.updates exists
if [ -f "package.json.updates" ]; then
  echo ""
  echo "📦 Updating package.json"
  
  # Check if jq is available
  if command -v jq &> /dev/null; then
    # Use jq to merge package.json.updates into package.json
    TEMP_FILE=$(mktemp)
    jq -s '.[0] * .[1]' package.json package.json.updates > $TEMP_FILE
    mv $TEMP_FILE package.json
    echo "✅ Updated package.json using jq"
  else
    echo "⚠️ jq is not installed, please manually merge package.json.updates into package.json"
    echo "   You can install jq with: brew install jq (macOS) or apt-get install jq (Linux)"
  fi
else
  echo ""
  echo "⚠️ package.json.updates not found, skipping package.json update"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies"
npm install --legacy-peer-deps
echo "✅ Dependencies installed"

# Run the test script
echo ""
echo "🧪 Running test script"
./scripts/test-analysis-tools.sh

# Add all files to git
echo ""
echo "📝 Adding files to git"
git add .
echo "✅ Files added to git"

# Commit the changes
echo ""
echo "💾 Committing changes"
git commit -m "$COMMIT_MESSAGE"
echo "✅ Changes committed"

echo ""
echo "🎉 Branch $BRANCH_NAME created and changes committed!"
echo ""
echo "Next steps:"
echo "  1. Push the branch to the remote repository:"
echo "     git push -u origin $BRANCH_NAME"
echo ""
echo "  2. Create a pull request to merge the branch into main"
echo ""
echo "  3. After the pull request is merged, you can delete the branch:"
echo "     git branch -d $BRANCH_NAME"