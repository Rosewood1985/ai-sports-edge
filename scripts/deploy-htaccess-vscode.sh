#!/bin/bash

# Script to deploy only the .htaccess file to the server using VS Code SFTP extension configuration
# This is needed because the regular deployment scripts exclude .htaccess

echo "🚀 Deploying .htaccess file to server using VS Code SFTP configuration..."

# Check if the VS Code SFTP config exists
if [ ! -f "vscode-sftp-deploy/.vscode/sftp.json" ]; then
  echo "❌ VS Code SFTP configuration not found at vscode-sftp-deploy/.vscode/sftp.json"
  exit 1
fi

# Extract credentials from VS Code SFTP config
SFTP_HOST=$(grep -o '"host": *"[^"]*"' vscode-sftp-deploy/.vscode/sftp.json | sed 's/"host": *"\(.*\)"/\1/')
SFTP_USER=$(grep -o '"username": *"[^"]*"' vscode-sftp-deploy/.vscode/sftp.json | sed 's/"username": *"\(.*\)"/\1/')
SFTP_PASSWORD=$(grep -o '"password": *"[^"]*"' vscode-sftp-deploy/.vscode/sftp.json | sed 's/"password": *"\(.*\)"/\1/')
SFTP_REMOTE_PATH=$(grep -o '"remotePath": *"[^"]*"' vscode-sftp-deploy/.vscode/sftp.json | sed 's/"remotePath": *"\(.*\)"/\1/')
SFTP_PORT=$(grep -o '"port": *[0-9]*' vscode-sftp-deploy/.vscode/sftp.json | sed 's/"port": *\([0-9]*\)/\1/')

echo "📋 Using configuration:"
echo "Host: $SFTP_HOST"
echo "User: $SFTP_USER"
echo "Remote path: $SFTP_REMOTE_PATH"
echo "Port: ${SFTP_PORT:-22}"

# Create a temporary script for sftp deployment
TEMP_SCRIPT=$(mktemp)

# Write deployment script using password authentication
cat > $TEMP_SCRIPT << EOL
#!/bin/bash
cd ./dist
echo "put .htaccess $SFTP_REMOTE_PATH/.htaccess" | sshpass -p "$SFTP_PASSWORD" sftp -P ${SFTP_PORT:-22} $SFTP_USER@$SFTP_HOST
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
  sshpass -p "$SFTP_PASSWORD" scp -P ${SFTP_PORT:-22} ./dist/.htaccess $SFTP_USER@$SFTP_HOST:$SFTP_REMOTE_PATH/
  
  if [ $? -eq 0 ]; then
    echo "✅ .htaccess file deployed successfully with alternative method!"
  else
    echo "❌ Both deployment methods failed."
    echo "Please manually upload the .htaccess file using VS Code SFTP extension:"
    echo "1. Right-click on dist/.htaccess in VS Code"
    echo "2. Select 'Upload File'"
  fi
fi

# Clean up
rm $TEMP_SCRIPT

echo "🔍 Post-deployment verification checklist:"
echo "1. Visit https://aisportsedge.app in incognito mode or hard refresh"
echo "2. Ensure no reload loop"
echo "3. Ensure no integrity, MIME, or CSP errors in Console"
echo "4. Confirm Firebase authentication works"
echo "5. Verify language toggle works and Spanish text appears when selected"