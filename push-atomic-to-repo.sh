#!/bin/bash

# Script to push atomic architecture code to the source code repository
# This script commits and pushes the atomic architecture changes to the repository

# Set up variables
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BRANCH_NAME="feature/atomic-architecture-$TIMESTAMP"
COMMIT_MESSAGE="Implement atomic architecture

- Add atomic structure (atoms, molecules, organisms, templates, pages)
- Migrate components to atomic architecture
- Add testing infrastructure
- Add documentation"

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "Error: git is not installed. Please install git and try again."
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --is-inside-work-tree &> /dev/null; then
    echo "Error: Not in a git repository. Please run this script from within a git repository."
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "There are uncommitted changes in the repository."
    echo "Do you want to continue? (y/n)"
    read -r response
    if [[ "$response" != "y" ]]; then
        echo "Aborting."
        exit 1
    fi
fi

echo "Creating new branch: $BRANCH_NAME"
git checkout -b "$BRANCH_NAME"

echo "Adding atomic architecture files"
git add atomic/
git add __tests__/atomic/
git add jest.config.atomic.js
git add jest.setup.atomic.js
git add deploy-atomic.sh
git add cleanup-atomic.sh
git add .eslintrc.atomic.js

echo "Committing changes"
git commit -m "$COMMIT_MESSAGE"

echo "Do you want to push the changes to the remote repository? (y/n)"
read -r response
if [[ "$response" == "y" ]]; then
    echo "Pushing changes to remote repository"
    git push -u origin "$BRANCH_NAME"
    echo "Changes pushed successfully to branch: $BRANCH_NAME"
    echo "You can now create a pull request to merge these changes into the main branch."
else
    echo "Changes committed to local branch: $BRANCH_NAME"
    echo "You can push the changes later with: git push -u origin $BRANCH_NAME"
fi

echo "Done!"