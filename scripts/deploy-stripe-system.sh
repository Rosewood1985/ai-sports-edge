#!/bin/bash

# Deploy Stripe Extension System
echo "🚀 Deploying Stripe Extension System..."

# Check Firebase authentication
echo "🔐 Checking Firebase authentication..."
if ! firebase projects:list >/dev/null 2>&1; then
    echo "❌ Not authenticated with Firebase. Running login..."
    firebase login
fi

# Set project
echo "📋 Setting Firebase project..."
firebase use ai-sports-edge

# Deploy functions
echo "⚡ Deploying Firebase functions..."
firebase deploy --only functions

# Deploy Firestore rules
echo "🔒 Deploying Firestore security rules..."
firebase deploy --only firestore:rules

# Verify extension installation
echo "🧩 Checking Stripe extension status..."
firebase ext:list

echo "✅ Deployment completed!"
echo ""
echo "🧪 Next: Run integration tests"
echo "📝 Test commands:"
echo "  npm run test:stripe"
echo "  npm run test:integration"
echo ""
echo "🌐 Ready for production verification!"