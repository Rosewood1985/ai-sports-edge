#!/bin/bash

# Deploy Firebase Authentication Fix
# This script deploys the fixes for the Firebase authentication error

echo "🚀 Deploying Firebase Authentication Fix..."

# 1. Backup current files
echo "📦 Creating backups..."
mkdir -p ./backups/$(date +%Y%m%d)
cp .env.production ./backups/$(date +%Y%m%d)/.env.production.bak
cp webpack.prod.js ./backups/$(date +%Y%m%d)/webpack.prod.js.bak
cp public/login.html ./backups/$(date +%Y%m%d)/public_login.html.bak
cp aisportsedge-deploy/login.html ./backups/$(date +%Y%m%d)/aisportsedge_deploy_login.html.bak

# 2. Build the project with the new configuration
echo "🔨 Building project with new configuration..."

# Fix the Haste module naming collision issue
echo "🔧 Fixing package.json naming collision..."
mv xcode-git-ai-sports-edge/package.json xcode-git-ai-sports-edge/package.json.temp

# Run the build
echo "🔨 Building project..."
npm run build

# Restore the moved file
echo "🔄 Restoring files..."
mv xcode-git-ai-sports-edge/package.json.temp xcode-git-ai-sports-edge/package.json

# 3. Deploy to production
echo "🚀 Deploying to production..."
# Deploy to Firebase hosting
firebase deploy --only hosting

echo "✅ Deployment complete!"
echo "📝 Note: If you encounter any issues, backups are available in ./backups/$(date +%Y%m%d)/"