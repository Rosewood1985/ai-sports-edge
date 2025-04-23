#!/bin/bash

# Secure SFTP Deployment script using sftp-deploy npm package
# This script uses environment variables and SSH keys for secure deployment

echo "🚀 Starting secure SFTP deployment..."

# Check for required environment variables
if [ -z "$SFTP_HOST" ] || [ -z "$SFTP_USER" ] || [ -z "$SFTP_REMOTE_PATH" ]; then
  echo "❌ Missing required environment variables. Please set:"
  echo "   - SFTP_HOST (e.g., sftp.aisportsedge.app)"
  echo "   - SFTP_USER (e.g., deploy@aisportsedge.app)"
  echo "   - SFTP_REMOTE_PATH (e.g., /home/q15133yvmhnq/public_html/aisportsedge.app)"
  echo ""
  echo "Example:"
  echo "export SFTP_HOST=sftp.aisportsedge.app"
  echo "export SFTP_USER=deploy@aisportsedge.app"
  echo "export SFTP_REMOTE_PATH=/home/q15133yvmhnq/public_html/aisportsedge.app"
  echo "export SFTP_PASSWORD=your_password  # Optional: only if not using SSH keys"
  echo "export SFTP_KEY_PATH=~/.ssh/id_rsa  # Optional: path to SSH private key"
  exit 1
fi

# Set local directory (default to ./dist if not specified)
SFTP_LOCAL_DIR=${SFTP_LOCAL_DIR:-"./dist"}

# Create temporary sftp-config.json
TEMP_CONFIG=$(mktemp)
echo "📝 Creating temporary deployment configuration..."

# Build config JSON based on available credentials
if [ ! -z "$SFTP_PASSWORD" ]; then
  # Password-based authentication
  cat > $TEMP_CONFIG << EOL
{
  "host": "$SFTP_HOST",
  "port": ${SFTP_PORT:-22},
  "username": "$SFTP_USER",
  "password": "$SFTP_PASSWORD",
  "remotePath": "$SFTP_REMOTE_PATH",
  "localDir": "$SFTP_LOCAL_DIR",
  "exclude": ${SFTP_EXCLUDE:-"[\".htaccess\"]"}
}
EOL
elif [ ! -z "$SFTP_KEY_PATH" ]; then
  # SSH key-based authentication
  cat > $TEMP_CONFIG << EOL
{
  "host": "$SFTP_HOST",
  "port": ${SFTP_PORT:-22},
  "username": "$SFTP_USER",
  "privateKeyPath": "$SFTP_KEY_PATH",
  "remotePath": "$SFTP_REMOTE_PATH",
  "localDir": "$SFTP_LOCAL_DIR",
  "exclude": ${SFTP_EXCLUDE:-"[\".htaccess\"]"}
}
EOL
else
  # Try to use SSH agent or default key
  cat > $TEMP_CONFIG << EOL
{
  "host": "$SFTP_HOST",
  "port": ${SFTP_PORT:-22},
  "username": "$SFTP_USER",
  "agent": true,
  "remotePath": "$SFTP_REMOTE_PATH",
  "localDir": "$SFTP_LOCAL_DIR",
  "exclude": ${SFTP_EXCLUDE:-"[\".htaccess\"]"}
}
EOL
fi

# Display configuration (without sensitive data)
echo "📋 Deployment configuration:"
echo "Host: $SFTP_HOST"
echo "User: $SFTP_USER"
echo "Remote path: $SFTP_REMOTE_PATH"
echo "Local directory: $SFTP_LOCAL_DIR"
if [ ! -z "$SFTP_PASSWORD" ]; then
  echo "Authentication: Password (secure)"
elif [ ! -z "$SFTP_KEY_PATH" ]; then
  echo "Authentication: SSH key ($SFTP_KEY_PATH)"
else
  echo "Authentication: SSH agent or default key"
fi

# Run the deployment with the config file
echo "🔄 Running deployment..."
npx sftp-deploy --config $TEMP_CONFIG

# Check if deployment was successful
if [ $? -eq 0 ]; then
  echo "✅ Deployment completed successfully!"
else
  echo "❌ Deployment failed. Please check the logs for errors."
  
  # Try alternative deployment method if the first one fails
  echo "🔄 Trying alternative deployment method..."
  
  # Set environment variables for direct deployment
  export DEPLOY_HOST="$SFTP_HOST"
  export DEPLOY_USER="$SFTP_USER"
  export DEPLOY_PATH="$SFTP_REMOTE_PATH"
  
  # Only set password if provided (otherwise rely on SSH keys)
  if [ ! -z "$SFTP_PASSWORD" ]; then
    export DEPLOY_PASSWORD="$SFTP_PASSWORD"
  fi
  
  # Run deployment with environment variables
  npx sftp-deploy
  
  # Check if second attempt was successful
  if [ $? -eq 0 ]; then
    echo "✅ Deployment completed successfully on second attempt!"
  else
    echo "❌ Both deployment methods failed."
    
    # Suggest native SFTP as fallback
    echo "🔄 You can try using native SFTP as a fallback:"
    echo "./scripts/native-sftp-deploy.sh"
    
    # Or VS Code SFTP extension
    echo "   Or use VS Code SFTP extension instead."
    echo "   See docs/sftp-upload-guide.md for instructions."
  fi
  
  # Clear environment variables
  unset DEPLOY_HOST
  unset DEPLOY_USER
  unset DEPLOY_PASSWORD
  unset DEPLOY_PATH
fi

# Clean up temporary config file
rm $TEMP_CONFIG

echo "🔍 Post-deployment verification checklist:"
echo "1. Visit https://aisportsedge.app in incognito or hard refresh"
echo "2. Ensure no reload loop"
echo "3. Ensure no integrity, MIME, or CSP errors in Console"
echo "4. Confirm Firebase and routing work as expected"
echo "5. Verify language toggle works and Spanish text appears when selected"