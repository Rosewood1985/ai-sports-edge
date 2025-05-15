#!/bin/bash

# Script to create a new repository with only Phase 1 implementation files
# Usage: ./scripts/create-phase1-repo.sh

# Set variables
REPO_NAME="ai-sports-edge-phase1"
COMMIT_MESSAGE="Implement Phase 1 components: Push Notifications, Deep Linking, and Offline Mode"

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "Error: git is not installed. Please install git and try again."
    exit 1
fi

# Create a new directory for the Phase 1 repository
echo "Creating new repository directory: $REPO_NAME"
mkdir -p ~/$REPO_NAME

# Copy Phase 1 implementation files
echo "Copying Phase 1 implementation files"

# Services
mkdir -p ~/$REPO_NAME/services
cp services/pushNotificationService.ts ~/$REPO_NAME/services/
cp services/deepLinkingService.ts ~/$REPO_NAME/services/
cp services/offlineService.ts ~/$REPO_NAME/services/

# Components
mkdir -p ~/$REPO_NAME/components
cp components/DeepLinkHandler.tsx ~/$REPO_NAME/components/

# Screens
mkdir -p ~/$REPO_NAME/screens
cp screens/NotificationSettingsScreen.tsx ~/$REPO_NAME/screens/
cp screens/OfflineSettingsScreen.tsx ~/$REPO_NAME/screens/

# Navigation
mkdir -p ~/$REPO_NAME/navigation
cp navigation/types.ts ~/$REPO_NAME/navigation/

# Functions
mkdir -p ~/$REPO_NAME/functions
cp functions/processScheduledNotifications.js ~/$REPO_NAME/functions/

# Scripts
mkdir -p ~/$REPO_NAME/scripts
cp scripts/test-push-notifications.js ~/$REPO_NAME/scripts/
cp scripts/test-deep-linking.js ~/$REPO_NAME/scripts/
cp scripts/test-offline-mode.js ~/$REPO_NAME/scripts/

# Docs
mkdir -p ~/$REPO_NAME/docs
cp docs/push-notification-implementation.md ~/$REPO_NAME/docs/
cp docs/deep-linking-implementation.md ~/$REPO_NAME/docs/
cp docs/offline-mode-implementation.md ~/$REPO_NAME/docs/
cp docs/phase1-implementation-summary.md ~/$REPO_NAME/docs/

# Memory Bank
mkdir -p ~/$REPO_NAME/memory-bank
cp memory-bank/activeContext.md ~/$REPO_NAME/memory-bank/
cp memory-bank/progress.md ~/$REPO_NAME/memory-bank/
cp memory-bank/decisionLog.md ~/$REPO_NAME/memory-bank/

# Create README.md
cat > ~/$REPO_NAME/README.md << 'EOF'
# AI Sports Edge - Phase 1 Implementation

This repository contains the implementation of Phase 1 components for AI Sports Edge:

1. **Push Notification System**: Enabling real-time notifications for users
2. **Deep Linking System**: Supporting external links and campaign tracking
3. **Offline Mode**: Allowing app usage without an internet connection

## Components

### Push Notification System
- `services/pushNotificationService.ts`: Core service for managing notifications
- `screens/NotificationSettingsScreen.tsx`: UI for configuring notification preferences
- `functions/processScheduledNotifications.js`: Cloud Function for scheduled notifications
- `scripts/test-push-notifications.js`: Test script for verification
- `docs/push-notification-implementation.md`: Detailed documentation

### Deep Linking System
- `services/deepLinkingService.ts`: Core service for handling deep links
- `components/DeepLinkHandler.tsx`: Component for navigation
- `navigation/types.ts`: Type definitions for navigation
- `scripts/test-deep-linking.js`: Test script for verification
- `docs/deep-linking-implementation.md`: Detailed documentation

### Offline Mode
- `services/offlineService.ts`: Core service for managing offline functionality
- `screens/OfflineSettingsScreen.tsx`: UI for configuring offline settings
- `scripts/test-offline-mode.js`: Test script for verification
- `docs/offline-mode-implementation.md`: Detailed documentation

## Documentation

- `docs/phase1-implementation-summary.md`: Overview of all Phase 1 components

## Memory Bank

- `memory-bank/activeContext.md`: Current implementation focus
- `memory-bank/progress.md`: Implementation progress tracking
- `memory-bank/decisionLog.md`: Key decisions made during implementation
EOF

# Initialize git repository
echo "Initializing git repository"
cd ~/$REPO_NAME
git init

# Add all files
echo "Adding files to git"
git add .

# Commit changes
echo "Committing changes"
git commit -m "$COMMIT_MESSAGE"

echo "Repository created successfully at ~/$REPO_NAME"
echo ""
echo "To push to GitHub:"
echo "1. Create a new repository on GitHub"
echo "2. Run the following commands:"
echo "   cd ~/$REPO_NAME"
echo "   git remote add origin https://github.com/yourusername/$REPO_NAME.git"
echo "   git push -u origin main"