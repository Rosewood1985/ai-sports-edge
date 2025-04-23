#!/bin/bash

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Deploying build folder and fixing location on server...${NC}"

# Check if the build directory exists
if [ ! -d "build" ]; then
    echo -e "${RED}Build directory not found. Please make sure the build directory exists.${NC}"
    exit 1
fi

# Create the server-side fix script
echo -e "${YELLOW}Creating server-side fix script...${NC}"
cat > build/fix-build-location.sh << 'EOF'
#!/bin/bash

# ROO DEPLOYMENT FIX SCRIPT
# Moves all build files to the root of the public_html/aisportsedge.app/ directory
# Assumes this is running in /home/q15133yvmhnq/public_html/aisportsedge.app

BUILD_DIR="build"
ROOT_DIR="/home/q15133yvmhnq/public_html/aisportsedge.app"

# 1. Ensure we're in the correct root directory
cd "$ROOT_DIR" || {
  echo "❌ Failed to access root directory: $ROOT_DIR"
  exit 1
}

# 2. Move all contents from build/ to root
if [ -d "$BUILD_DIR" ]; then
  echo "📦 Moving contents of '$BUILD_DIR/' to root..."
  mv -f $BUILD_DIR/* $ROOT_DIR/
  echo "✅ Files moved."

  # 3. Remove the empty build folder
  rmdir "$BUILD_DIR" 2>/dev/null && echo "🧹 Removed empty '$BUILD_DIR/' folder." || echo "⚠️ '$BUILD_DIR/' not empty or could not be removed."
else
  echo "⚠️ '$BUILD_DIR/' folder does not exist. Nothing to move."
fi

# 4. List important files to confirm success
echo "📂 Current root directory contents:"
ls -al $ROOT_DIR | grep -E 'index.html|\.htaccess|bundle\.js|styles\.css'

# 5. Recommend verifying in browser
echo -e "\n🔍 Now open https://aisportsedge.app in incognito mode to verify deployment.\n"
exit 0
EOF

# Make the script executable
chmod +x build/fix-build-location.sh

# Check if VS Code is running
if ! pgrep -x "Code" > /dev/null; then
    echo -e "${YELLOW}VS Code is not running. Starting VS Code...${NC}"
    code . &
    sleep 5
fi

# Use the VS Code SFTP extension to upload the build folder
echo -e "${YELLOW}Uploading build folder via SFTP...${NC}"
echo -e "${YELLOW}Please use the VS Code command palette (Cmd+Shift+P) and type 'SFTP: Upload Folder'${NC}"
echo -e "${YELLOW}Then select the build folder to upload.${NC}"

# Wait for user confirmation
echo -e "${YELLOW}Press Enter when the upload is complete...${NC}"
read

# Extract credentials from SFTP config
echo -e "${YELLOW}Extracting SFTP credentials from configuration...${NC}"
SFTP_HOST=$(grep -o '"host": *"[^"]*"' vscode-sftp-deploy/.vscode/sftp.json | sed 's/"host": *"\(.*\)"/\1/')
SFTP_USER=$(grep -o '"username": *"[^"]*"' vscode-sftp-deploy/.vscode/sftp.json | sed 's/"username": *"\(.*\)"/\1/')
SFTP_PASSWORD=$(grep -o '"password": *"[^"]*"' vscode-sftp-deploy/.vscode/sftp.json | sed 's/"password": *"\(.*\)"/\1/')
SFTP_REMOTE_PATH=$(grep -o '"remotePath": *"[^"]*"' vscode-sftp-deploy/.vscode/sftp.json | sed 's/"remotePath": *"\(.*\)"/\1/')
SFTP_PORT=$(grep -o '"port": *[0-9]*' vscode-sftp-deploy/.vscode/sftp.json | sed 's/"port": *\([0-9]*\)/\1/')

# Run the fix script on the server
echo -e "${YELLOW}Running fix script on the server...${NC}"
sshpass -p "$SFTP_PASSWORD" ssh -p "$SFTP_PORT" "$SFTP_USER@$SFTP_HOST" "cd $SFTP_REMOTE_PATH && chmod +x fix-build-location.sh && ./fix-build-location.sh"

# Check if the SSH command was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Deployment completed successfully!${NC}"
    echo -e "${GREEN}Visit https://aisportsedge.app to verify the deployment.${NC}"
else
    echo -e "${RED}Failed to run the fix script on the server.${NC}"
    echo -e "${YELLOW}You may need to run it manually:${NC}"
    echo -e "${YELLOW}1. SSH into the server: ssh -p $SFTP_PORT $SFTP_USER@$SFTP_HOST${NC}"
    echo -e "${YELLOW}2. Navigate to the remote path: cd $SFTP_REMOTE_PATH${NC}"
    echo -e "${YELLOW}3. Make the script executable: chmod +x fix-build-location.sh${NC}"
    echo -e "${YELLOW}4. Run the script: ./fix-build-location.sh${NC}"
fi

# Log the deployment
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
echo "[${TIMESTAMP}] Deployed build folder to GoDaddy via SFTP and fixed build location" >> deployment.log