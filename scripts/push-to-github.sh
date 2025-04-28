#!/bin/bash

# Push changes to GitHub
# This script commits and pushes changes to the GitHub repository

# Exit on error
set -e

# Display script header
echo "=========================================="
echo "AI Sports Edge GitHub Push Script"
echo "=========================================="
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "Git is not installed. Please install git."
    exit 1
fi

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "Error: .git directory not found. Please run this script from the project root directory."
    exit 1
fi

# Check git status
git_status=$(git status --porcelain)
if [ -z "$git_status" ]; then
    echo "No changes to commit."
    exit 0
fi

# Show changes
echo "Changes to be committed:"
git status --short

# Prompt for commit message
echo ""
read -p "Enter commit message: " commit_message

if [ -z "$commit_message" ]; then
    echo "Error: Commit message cannot be empty."
    exit 1
fi

# Add all changes
echo ""
echo "Adding changes..."
git add .

# Commit changes
echo "Committing changes..."
git commit -m "$commit_message"

# Check if there's a remote repository
remote_exists=$(git remote -v)
if [ -z "$remote_exists" ]; then
    echo "No remote repository configured."
    exit 0
fi

# Get current branch
current_branch=$(git symbolic-ref --short HEAD)
echo "Current branch: $current_branch"

# Push changes
echo "Pushing changes to remote repository..."
git push origin $current_branch

echo ""
echo "=========================================="
echo "Changes pushed successfully!"
echo "Branch: $current_branch"
echo "Commit message: $commit_message"
echo "=========================================="