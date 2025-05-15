#!/bin/bash
# deploy-to-firebase.sh - Deploy to Firebase with verification

# Add logging
echo "$(date): Running deploy-to-firebase.sh" >> .roocode/tool_usage.log

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️ Warning: You have uncommitted changes"
  read -p "Do you want to continue deployment? (y/n) " continue_deploy
  if [ "$continue_deploy" != "y" ]; then
    echo "Deployment cancelled."
    exit 1
  fi
fi

# Build the application
echo "🔨 Building application..."
npm run build

# Deploy to Firebase
echo "🚀 Deploying to Firebase..."
firebase deploy

# Verify deployment
echo "✅ Deployment complete, verifying..."

# Check Firebase site
firebase_site=$(grep -o '"site": "[^"]*"' firebase.json | cut -d'"' -f4)
if [ -n "$firebase_site" ]; then
  echo "🔍 Verifying Firebase site: $firebase_site.web.app"
  
  # Fetch site and check for errors
  response=$(curl -s -o /dev/null -w "%{http_code}" "https://$firebase_site.web.app")
  if [ "$response" = "200" ]; then
    echo "✅ Firebase site is accessible"
  else
    echo "❌ Firebase site returned HTTP $response"
  fi
fi

# Verify custom domain if configured
if [ -f ".firebaserc" ]; then
  custom_domain=$(grep -o '"hosting": {[^}]*"site": "[^"]*"' .firebaserc | grep -o '"site": "[^"]*"' | cut -d'"' -f4)
  if [ -n "$custom_domain" ]; then
    echo "🔍 Verifying custom domain: $custom_domain"
    
    # Fetch domain and check for errors
    response=$(curl -s -o /dev/null -w "%{http_code}" "https://$custom_domain")
    if [ "$response" = "200" ]; then
      echo "✅ Custom domain is accessible"
    else
      echo "❌ Custom domain returned HTTP $response"
    fi
  fi
fi

# Check Stripe integration
if grep -q "STRIPE" .env 2>/dev/null; then
  echo "🔍 Verifying Stripe configuration..."
  
  # Check if we're using test keys
  if grep -q "STRIPE.*test" .env; then
    echo "⚠️ Stripe is configured with TEST keys"
  else
    echo "✅ Stripe is configured with PRODUCTION keys"
  fi
fi

# Run post-deploy validation
if [ -f "./scripts/post-deploy-validate.js" ]; then
  echo "🔍 Running post-deploy validation..."
  ./scripts/post-deploy-validate.js
  
  if [ $? -eq 0 ]; then
    echo "✅ Post-deploy validation passed"
  else
    echo "❌ Post-deploy validation failed"
  fi
fi

# Cleanup temporary files
echo "🧹 Cleaning up temporary files..."
rm -rf ./temp-deploy/* ./legacy-builds/*

echo "✅ Deployment verification complete!"

# Log deployment to status log
echo "## Firebase Deployment ($(date))" >> status/status-log.md
echo "" >> status/status-log.md
echo "Deployed to Firebase site: $firebase_site" >> status/status-log.md
if [ -n "$custom_domain" ]; then
  echo "Custom domain: $custom_domain" >> status/status-log.md
fi
echo "" >> status/status-log.md