#!/bin/bash

# Script to commit onboarding improvements to Git

# Set script to exit on error
set -e

# Check if Git is installed
if ! command -v git &> /dev/null; then
    echo "Error: Git is not installed or not in PATH"
    exit 1
fi

# Check if we're in a Git repository
if ! git rev-parse --is-inside-work-tree &> /dev/null; then
    echo "Error: Not in a Git repository"
    exit 1
fi

# Check for uncommitted changes
if [ -z "$(git status --porcelain)" ]; then
    echo "No changes to commit"
    exit 0
fi

# Add all modified files
echo "Adding modified files..."
git add components/OnboardingSlide.tsx
git add screens/OnboardingScreen.tsx
git add web/components/ConfirmationModal.js
git add web/pages/OnboardingPage.js
git add web/services/onboardingService.js
git add public/locales/en/onboarding.json
git add public/locales/es/onboarding.json
git add docs/onboarding-security-improvements.md

# Commit changes
echo "Committing changes..."
git commit -m "Improve onboarding experience with security and accessibility enhancements

- Added error handling to all onboarding functions
- Improved accessibility for onboarding components
- Added XSS protection for user data
- Implemented secure storage with backup mechanisms
- Added comprehensive documentation
- Added translations for error messages
- Replaced window.confirm with accessible modal
- Added input validation for all parameters"

echo "Changes committed successfully!"
echo "To push changes to remote repository, run: git push"