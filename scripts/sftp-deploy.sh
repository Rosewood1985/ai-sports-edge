#!/bin/bash

# SFTP Deployment script using sftp-deploy npm package
# This script uses the sftp-config.json file for deployment settings

echo "🚀 Starting SFTP deployment..."

# Check if sftp-config.json exists
if [ ! -f "sftp-config.json" ]; then
  echo "❌ sftp-config.json not found. Creating default configuration..."
  cat > sftp-config.json << 'EOL'
{
  "host": "sftp.aisportsedge.app",
  "port": 22,
  "username": "deploy@aisportsedge.app",
  "password": "hTQ3LQ]#P(b,",
  "remotePath": "/home/q15133yvmhnq/public_html/aisportsedge.app",
  "localDir": "./dist",
  "exclude": [".htaccess"]
}
EOL
  echo "✅ Created sftp-config.json"
fi

# Display configuration
echo "📋 Deployment configuration:"
echo "$(cat sftp-config.json | grep -v password)"
echo "Password: ********"

# Run the deployment with the config file
echo "🔄 Running deployment..."
npx sftp-deploy --config sftp-config.json

# Check if deployment was successful
if [ $? -eq 0 ]; then
  echo "✅ Deployment completed successfully!"
else
  echo "❌ Deployment failed. Please check the logs for errors."
  
  # Try alternative deployment method if the first one fails
  echo "🔄 Trying alternative deployment method..."
  
  # Extract values from config file
  HOST=$(grep -o '"host": *"[^"]*"' sftp-config.json | cut -d'"' -f4)
  USER=$(grep -o '"username": *"[^"]*"' sftp-config.json | cut -d'"' -f4)
  PASS=$(grep -o '"password": *"[^"]*"' sftp-config.json | cut -d'"' -f4)
  REMOTE_PATH=$(grep -o '"remotePath": *"[^"]*"' sftp-config.json | cut -d'"' -f4)
  LOCAL_DIR=$(grep -o '"localDir": *"[^"]*"' sftp-config.json | cut -d'"' -f4)
  
  # Set environment variables
  export DEPLOY_HOST="$HOST"
  export DEPLOY_USER="$USER"
  export DEPLOY_PASSWORD="$PASS"
  export DEPLOY_PATH="$REMOTE_PATH"
  
  # Run deployment with environment variables
  npx sftp-deploy
  
  # Check if second attempt was successful
  if [ $? -eq 0 ]; then
    echo "✅ Deployment completed successfully on second attempt!"
  else
    echo "❌ Both deployment methods failed. Please try using VS Code SFTP extension instead."
    echo "   See docs/sftp-upload-guide.md for instructions."
  fi
  
  # Clear environment variables
  unset DEPLOY_HOST
  unset DEPLOY_USER
  unset DEPLOY_PASSWORD
  unset DEPLOY_PATH
fi

echo "🔍 Post-deployment verification checklist:"
echo "1. Visit https://aisportsedge.app in incognito or hard refresh"
echo "2. Ensure no reload loop"
echo "3. Ensure no integrity, MIME, or CSP errors in Console"
echo "4. Confirm Firebase and routing work as expected"
echo "5. Verify language toggle works and Spanish text appears when selected"