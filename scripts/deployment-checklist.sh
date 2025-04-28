#!/bin/bash

# Deployment Checklist for AI Sports Edge
# This script guides you through the deployment process

echo "🚀 AI SPORTS EDGE - DEPLOYMENT CHECKLIST"
echo "========================================="
echo ""

# Step 1: Check for duplicate SFTP configs
echo "STEP 1: Checking for duplicate SFTP configs..."
SFTP_CONFIG="vscode-sftp-deploy/.vscode/sftp.json"
OTHER_CONFIGS=$(find . -name "sftp.json" | grep -v "$SFTP_CONFIG")

if [ -n "$OTHER_CONFIGS" ]; then
  echo "⚠️  WARNING: Found duplicate SFTP configs:"
  echo "$OTHER_CONFIGS"
  echo ""
  read -p "Do you want to delete these duplicate configs? (y/n): " DELETE_CONFIGS
  if [ "$DELETE_CONFIGS" = "y" ]; then
    echo "$OTHER_CONFIGS" | xargs rm
    echo "✅ Duplicate configs deleted."
  else
    echo "⚠️  Please delete duplicate configs manually before proceeding."
    exit 1
  fi
else
  echo "✅ Only one SFTP config exists at $SFTP_CONFIG"
fi

echo ""

# Step 2: Verify SFTP config content
echo "STEP 2: Verifying SFTP config content..."
if [ ! -f "$SFTP_CONFIG" ]; then
  echo "⚠️  ERROR: SFTP config not found at $SFTP_CONFIG"
  exit 1
fi

# Check for required fields
MISSING_FIELDS=""
grep -q '"name": *"AI Sports Edge"' "$SFTP_CONFIG" || MISSING_FIELDS="$MISSING_FIELDS\n- name: AI Sports Edge"
grep -q '"host": *"sftp.aisportsedge.app"' "$SFTP_CONFIG" || MISSING_FIELDS="$MISSING_FIELDS\n- host: sftp.aisportsedge.app"
grep -q '"port": *22' "$SFTP_CONFIG" || MISSING_FIELDS="$MISSING_FIELDS\n- port: 22"
grep -q '"username": *"deploy@aisportsedge.app"' "$SFTP_CONFIG" || MISSING_FIELDS="$MISSING_FIELDS\n- username: deploy@aisportsedge.app"
grep -q '"remotePath": *"/home/q15133yvmhnq/public_html/aisportsedge.app"' "$SFTP_CONFIG" || MISSING_FIELDS="$MISSING_FIELDS\n- remotePath: /home/q15133yvmhnq/public_html/aisportsedge.app"
grep -q '"localPath": *"./dist"' "$SFTP_CONFIG" || MISSING_FIELDS="$MISSING_FIELDS\n- localPath: ./dist"
grep -q '"protocol": *"sftp"' "$SFTP_CONFIG" || MISSING_FIELDS="$MISSING_FIELDS\n- protocol: sftp"
grep -q '"uploadOnSave": *true' "$SFTP_CONFIG" || MISSING_FIELDS="$MISSING_FIELDS\n- uploadOnSave: true"

if [ -n "$MISSING_FIELDS" ]; then
  echo "⚠️  WARNING: SFTP config is missing or has incorrect fields:"
  echo -e "$MISSING_FIELDS"
  echo ""
  echo "Please update the config at $SFTP_CONFIG with the correct values."
  exit 1
else
  echo "✅ SFTP config content verified."
fi

echo ""

# Step 3: Check local dist directory
echo "STEP 3: Checking local /dist/ contents..."
DIST_DIR="./dist"

if [ ! -d "$DIST_DIR" ]; then
  echo "⚠️  ERROR: Local dist directory not found. Build the project first."
  exit 1
fi

# Check for required files
echo "Checking for required files in $DIST_DIR:"
MISSING_FILES=""
[ -f "$DIST_DIR/index.html" ] && echo "✅ index.html found" || MISSING_FILES="$MISSING_FILES\n- index.html"

if [ -n "$MISSING_FILES" ]; then
  echo "⚠️  WARNING: Some required files are missing from $DIST_DIR:"
  echo -e "$MISSING_FILES"
  echo ""
  echo "Please build the project properly before deploying."
  exit 1
fi

# Check for absolute paths in index.html
echo "Checking for correct paths in index.html..."
if grep -q "src=\"\.\/" "$DIST_DIR/index.html" || grep -q "href=\"\.\/" "$DIST_DIR/index.html"; then
  echo "⚠️  WARNING: index.html contains relative paths (./). These should be absolute paths."
  echo "Please fix the paths in index.html before deploying."
else
  echo "✅ Path references in index.html look good."
fi

echo ""

# Step 4: Offer guided deployment
echo "STEP 4: Ready for deployment!"
echo ""
read -p "Would you like to proceed with guided deployment? (y/n): " GUIDED_DEPLOY

if [ "$GUIDED_DEPLOY" = "y" ]; then
  echo ""
  echo "Starting guided deployment process..."
  
  # Extract remote path from config
  REMOTE_PATH=$(grep -o '"remotePath": *"[^"]*"' "$SFTP_CONFIG" | cut -d'"' -f4)
  
  # Step 4.1: Clean up remote directory
  echo ""
  echo "STEP 4.1: Cleaning up remote directory..."
  echo "This will remove all .html, .js, .css, .map, and .json files from the remote server"
  echo "while preserving assets/, images/, and locales/ folders."
  echo ""
  echo "To clean up the remote directory:"
  echo "1. Connect to the server using your preferred SFTP client"
  echo "2. Navigate to $REMOTE_PATH"
  echo "3. Delete all .html, .js, .css, .map, and .json files"
  echo "4. Preserve the assets/, images/, and locales/ folders"
  echo ""
  read -p "Have you completed the remote cleanup or want to skip? (y/n): " REMOTE_CLEANUP_DONE
  
  if [ "$REMOTE_CLEANUP_DONE" = "y" ]; then
    echo "✅ Remote cleanup completed or skipped."
  else
    echo "Please complete the remote cleanup before proceeding."
    exit 1
  fi
  
  # Step 4.2: Upload files
  echo ""
  echo "STEP 4.2: Uploading files from ./dist to remote server..."
  echo ""
  echo "To upload files using VS Code SFTP extension:"
  echo "1. Open VS Code"
  echo "2. Right-click on the dist folder"
  echo "3. Select 'SFTP: Upload Folder'"
  echo ""
  read -p "Would you like to open VS Code to upload files? (y/n): " OPEN_VSCODE
  
  if [ "$OPEN_VSCODE" = "y" ]; then
    echo "Opening VS Code..."
    code .
    read -p "Have you completed the file upload? (y/n): " FILE_UPLOAD_DONE
    
    if [ "$FILE_UPLOAD_DONE" = "y" ]; then
      echo "✅ Files uploaded successfully."
    else
      echo "Please complete the file upload before proceeding."
      exit 1
    fi
  else
    read -p "Have you already uploaded the files or want to skip? (y/n): " FILE_UPLOAD_DONE
    
    if [ "$FILE_UPLOAD_DONE" = "y" ]; then
      echo "✅ Files uploaded or upload skipped."
    else
      echo "Please upload the files before proceeding."
      exit 1
    fi
  fi
  
  # Step 4.3: Verify deployment
  echo ""
  echo "STEP 4.3: Verifying deployment..."
  echo ""
  echo "To verify the deployment:"
  echo "1. Open a web browser"
  echo "2. Navigate to https://aisportsedge.app"
  echo "3. Verify that the site loads correctly"
  echo "4. Check that all features are working as expected"
  echo ""
  read -p "Have you verified the deployment? (y/n): " VERIFY_DEPLOY_DONE
  
  if [ "$VERIFY_DEPLOY_DONE" = "y" ]; then
    echo "✅ Deployment verified successfully."
  else
    echo "Please verify the deployment before proceeding."
    exit 1
  fi
  
  echo ""
  echo "🎉 Guided deployment completed successfully!"
else
  echo ""
  echo "STEP 4: Manual deployment instructions:"
  echo ""
  echo "To deploy via VS Code SFTP extension:"
  echo "1. Open VS Code"
  echo "2. Right-click on /dist folder → SFTP: Upload Folder"
  echo "   OR right-click any file and choose \"Upload via SFTP\""
  echo ""
  echo "Alternatively, use one of our deployment scripts:"
  echo "- For full checks and deployment: ./scripts/pre-deploy-checks.sh"
  echo "- For quick deployment: ./scripts/quick-deploy.sh"
  echo ""
  
  echo "STEP 5: After deployment, verify in GoDaddy File Manager:"
  echo "1. Go to public_html/aisportsedge.app/"
  echo "2. Confirm index.html was updated recently"
  echo "3. Verify all subfolders like assets/ and images/ exist and are populated"
  echo "4. Check for any leftover files from old builds"
fi

echo ""
echo "🎉 Deployment checklist complete!"
exit 0