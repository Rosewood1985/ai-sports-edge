#!/bin/bash

# Script to push Phase 1 implementation to GitHub
# Usage: ./scripts/push-phase1-to-github.sh

# Set variables
BRANCH_NAME="phase1-implementation"
COMMIT_MESSAGE="Implement Phase 1 components: Push Notifications, Deep Linking, and Offline Mode"

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "Error: git is not installed. Please install git and try again."
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --is-inside-work-tree &> /dev/null; then
    echo "Error: Not in a git repository. Please run this script from the root of the repository."
    exit 1
fi

# Check if there are uncommitted changes
if ! git diff-index --quiet HEAD --; then
    # Create a new branch
    echo "Creating branch: $BRANCH_NAME"
    git checkout -b $BRANCH_NAME

    # Add all files
    echo "Adding files to git"
    git add .

    # Commit changes
    echo "Committing changes"
    git commit -m "$COMMIT_MESSAGE"

    # Push to GitHub
    echo "Pushing to GitHub"
    git push -u origin $BRANCH_NAME

    echo "Successfully pushed Phase 1 implementation to GitHub branch: $BRANCH_NAME"
else
    echo "No changes to commit. Make sure you've made changes to the repository."
    exit 1
fi

# List of files added in Phase 1 implementation
echo "Files added in Phase 1 implementation:"
echo "- services/pushNotificationService.ts"
echo "- screens/NotificationSettingsScreen.tsx"
echo "- functions/processScheduledNotifications.js"
echo "- scripts/test-push-notifications.js"
echo "- docs/push-notification-implementation.md"
echo "- services/deepLinkingService.ts"
echo "- components/DeepLinkHandler.tsx"
echo "- navigation/types.ts"
echo "- scripts/test-deep-linking.js"
echo "- docs/deep-linking-implementation.md"
echo "- services/offlineService.ts"
echo "- screens/OfflineSettingsScreen.tsx"
echo "- scripts/test-offline-mode.js"
echo "- docs/offline-mode-implementation.md"
echo "- docs/phase1-implementation-summary.md"
echo "- memory-bank/activeContext.md (updated)"
echo "- memory-bank/progress.md (updated)"
echo "- memory-bank/decisionLog.md (updated)"

# Create a pull request (optional)
echo ""
echo "To create a pull request, visit:"
echo "https://github.com/yourusername/ai-sports-edge/pull/new/$BRANCH_NAME"