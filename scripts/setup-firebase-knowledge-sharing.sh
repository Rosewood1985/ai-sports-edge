#!/bin/bash
# setup-firebase-knowledge-sharing.sh - Set up Firebase knowledge sharing materials

set -e

echo "Setting up Firebase knowledge sharing materials..."

# Ensure the firebase-knowledge-sharing.sh script is executable
chmod +x scripts/firebase-knowledge-sharing.sh

# Create directories
mkdir -p docs/firebase
mkdir -p docs/presentations
mkdir -p docs/training

# Set up all knowledge sharing materials
./scripts/firebase-knowledge-sharing.sh setup

echo ""
echo "======================================================"
echo "Firebase Knowledge Sharing Setup Complete!"
echo "======================================================"
echo ""
echo "The following materials have been created:"
echo ""
echo "1. Firebase Tips and Tricks"
echo "   - docs/firebase/firebase-tips.md"
echo ""
echo "2. Training Presentations"
echo "   - docs/presentations/firebase-auth-training.md"
echo "   - docs/presentations/firebase-firestore-training.md"
echo "   - docs/presentations/firebase-storage-training.md"
echo "   - docs/presentations/firebase-functions-training.md"
echo "   - docs/presentations/firebase-analytics-training.md"
echo ""
echo "3. Training Exercises"
echo "   - docs/training/firebase-auth-exercises.md"
echo "   - docs/training/firebase-firestore-exercises.md"
echo "   - docs/training/firebase-storage-exercises.md"
echo "   - docs/training/firebase-functions-exercises.md"
echo "   - docs/training/firebase-analytics-exercises.md"
echo ""
echo "4. Code Review Checklist"
echo "   - docs/firebase/firebase-code-review-checklist.md"
echo ""
echo "5. Firebase FAQ"
echo "   - docs/firebase/firebase-faq.md"
echo ""
echo "6. Slack Announcement"
echo "   - docs/firebase/firebase-slack-announcement.md"
echo ""
echo "These materials are designed to help the team understand and use the consolidated Firebase service."
echo ""
echo "To create individual materials, run:"
echo "  ./scripts/firebase-knowledge-sharing.sh <command>"
echo ""
echo "Available commands:"
echo "  tips               Create Firebase tips document"
echo "  training <topic>   Create training presentation (auth, firestore, storage, functions, analytics)"
echo "  exercises <topic>  Create training exercises (auth, firestore, storage, functions, analytics)"
echo "  checklist          Create code review checklist"
echo "  faq                Create Firebase FAQ"
echo "  announcement       Create Slack announcement"
echo "  setup              Set up all knowledge sharing materials"
echo "  help               Show help message"