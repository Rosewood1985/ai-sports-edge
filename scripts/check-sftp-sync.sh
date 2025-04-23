#!/bin/bash

# Script to check for mismatched files between local /dist and remote /public_html/aisportsedge.app/
# Created as part of SFTP config standardization

echo "Checking for mismatched files between local and remote..."

# Define paths
LOCAL_PATH="./dist"
REMOTE_PATH="/home/q15133yvmhnq/public_html/aisportsedge.app"
SFTP_CONFIG="vscode-sftp-deploy/.vscode/sftp.json"

# Check if local dist directory exists
if [ ! -d "$LOCAL_PATH" ]; then
  echo "⚠️  Local dist directory not found. Build the project first."
  exit 1
fi

# Extract SFTP credentials from config
if [ ! -f "$SFTP_CONFIG" ]; then
  echo "⚠️  SFTP config not found at $SFTP_CONFIG"
  exit 1
fi

HOST=$(grep -o '"host": *"[^"]*"' $SFTP_CONFIG | cut -d'"' -f4)
PORT=$(grep -o '"port": *[0-9]*' $SFTP_CONFIG | awk '{print $2}')
USERNAME=$(grep -o '"username": *"[^"]*"' $SFTP_CONFIG | cut -d'"' -f4)
PASSWORD=$(grep -o '"password": *"[^"]*"' $SFTP_CONFIG | cut -d'"' -f4)

# Create temporary file lists
LOCAL_FILES_TMP=$(mktemp)
REMOTE_FILES_TMP=$(mktemp)

# Get local file list with sizes
find $LOCAL_PATH -type f -not -path "*/\.*" | sort > $LOCAL_FILES_TMP

# Get remote file list using SFTP
echo "Connecting to remote server to check files..."
sshpass -p "$PASSWORD" sftp -P $PORT $USERNAME@$HOST << EOF > /dev/null
cd $REMOTE_PATH
ls -la
bye
EOF

if [ $? -ne 0 ]; then
  echo "⚠️  Failed to connect to remote server. Check credentials."
  rm $LOCAL_FILES_TMP $REMOTE_FILES_TMP
  exit 1
fi

# Compare file lists
echo "Comparing local and remote files..."
DIFF_COUNT=$(diff -y --suppress-common-lines $LOCAL_FILES_TMP $REMOTE_FILES_TMP | wc -l)

if [ $DIFF_COUNT -gt 0 ]; then
  echo "⚠️  Found $DIFF_COUNT mismatched files between local and remote."
  echo ""
  
  # Ask for confirmation to force overwrite
  read -p "Would you like to force overwrite all remote files? (y/n): " CONFIRM
  if [ "$CONFIRM" = "y" ]; then
    echo "Starting force upload of all files..."
    
    # Use sshpass to automate SFTP upload
    sshpass -p "$PASSWORD" sftp -P $PORT $USERNAME@$HOST << EOF
    cd $REMOTE_PATH
    put -r $LOCAL_PATH/* .
    bye
EOF
    
    if [ $? -eq 0 ]; then
      echo "✅ Force upload completed successfully."
    else
      echo "⚠️  Force upload failed. Please check logs."
    fi
  else
    echo "No files were overwritten. Use VS Code SFTP extension to sync manually."
  fi
else
  echo "✅ Local and remote files are in sync."
fi

# Clean up temp files
rm $LOCAL_FILES_TMP $REMOTE_FILES_TMP

exit 0