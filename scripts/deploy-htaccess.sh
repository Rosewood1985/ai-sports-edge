#!/bin/bash

# Script to deploy only the .htaccess file to the server
# This is needed because the regular deployment scripts exclude .htaccess

echo "🚀 Deploying .htaccess file to server..."

# Set required environment variables
export SFTP_HOST="sftp.aisportsedge.app"
export SFTP_USER="deploy@aisportsedge.app"
export SFTP_REMOTE_PATH="/home/q15133yvmhnq/public_html/aisportsedge.app"
export SFTP_LOCAL_DIR="./dist"
export SFTP_KEY_PATH="$HOME/.ssh/id_rsa"

# Create a temporary script for sftp deployment
TEMP_SCRIPT=$(mktemp)

# Write deployment script
cat > $TEMP_SCRIPT << EOL
#!/bin/bash
cd $SFTP_LOCAL_DIR
echo "put .htaccess $SFTP_REMOTE_PATH/.htaccess" | sftp -i $SFTP_KEY_PATH $SFTP_USER@$SFTP_HOST
EOL

# Make script executable
chmod +x $TEMP_SCRIPT

# Run the script
echo "📤 Uploading .htaccess file..."
$TEMP_SCRIPT

# Check if deployment was successful
if [ $? -eq 0 ]; then
  echo "✅ .htaccess file deployed successfully!"
else
  echo "❌ Deployment failed. Trying alternative method..."
  
  # Try alternative method with scp
  scp -i $SFTP_KEY_PATH $SFTP_LOCAL_DIR/.htaccess $SFTP_USER@$SFTP_HOST:$SFTP_REMOTE_PATH/
  
  if [ $? -eq 0 ]; then
    echo "✅ .htaccess file deployed successfully with alternative method!"
  else
    echo "❌ Both deployment methods failed."
    echo "Please manually upload the .htaccess file using VS Code SFTP extension."
  fi
fi

# Clean up
rm $TEMP_SCRIPT

# Clear environment variables
unset SFTP_HOST
unset SFTP_USER
unset SFTP_REMOTE_PATH
unset SFTP_LOCAL_DIR
unset SFTP_KEY_PATH

echo "🔍 Post-deployment verification checklist:"
echo "1. Visit https://aisportsedge.app in incognito or hard refresh"
echo "2. Ensure no reload loop"
echo "3. Ensure no integrity, MIME, or CSP errors in Console"
echo "4. Confirm Firebase authentication works"
echo "5. Verify language toggle works and Spanish text appears when selected"