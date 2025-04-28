#!/bin/bash
# Deployment script for AI Sports Edge to GoDaddy web app

# Set variables
GODADDY_HOST="aisportsedge.app"
GODADDY_USER="admin@aisportsedge.app"
GODADDY_PATH="/var/www/html"
SSH_KEY_PATH="$HOME/.ssh/godaddy_rsa"
LOCAL_BUILD_DIR="./build"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting deployment to GoDaddy web app (${GODADDY_HOST})...${NC}"

# Build the application
echo -e "${YELLOW}Building the application...${NC}"
npm run build

if [ $? -ne 0 ]; then
  echo -e "${RED}Build failed. Aborting deployment.${NC}"
  exit 1
fi

echo -e "${GREEN}Build successful.${NC}"

# Create a deployment package
echo -e "${YELLOW}Creating deployment package...${NC}"
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
DEPLOY_PACKAGE="deploy-$TIMESTAMP.tar.gz"

tar -czf $DEPLOY_PACKAGE -C $LOCAL_BUILD_DIR .

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create deployment package. Aborting.${NC}"
  exit 1
fi

echo -e "${GREEN}Deployment package created: $DEPLOY_PACKAGE${NC}"

# Upload to GoDaddy
echo -e "${YELLOW}Uploading to GoDaddy...${NC}"
scp -i $SSH_KEY_PATH $DEPLOY_PACKAGE $GODADDY_USER@$GODADDY_HOST:/tmp/

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to upload deployment package. Aborting.${NC}"
  exit 1
fi

echo -e "${GREEN}Upload successful.${NC}"

# Extract and deploy on the server
echo -e "${YELLOW}Deploying on the server...${NC}"
ssh -i $SSH_KEY_PATH $GODADDY_USER@$GODADDY_HOST << EOF
  # Backup current deployment
  if [ -d $GODADDY_PATH ]; then
    BACKUP_DIR="${GODADDY_PATH}_backup_\$(date +"%Y%m%d%H%M%S")"
    echo "Backing up current deployment to \$BACKUP_DIR"
    cp -r $GODADDY_PATH \$BACKUP_DIR
  fi

  # Clear current deployment directory
  echo "Clearing current deployment directory"
  rm -rf $GODADDY_PATH/*

  # Extract new deployment
  echo "Extracting new deployment"
  tar -xzf /tmp/$DEPLOY_PACKAGE -C $GODADDY_PATH

  # Set permissions
  echo "Setting permissions"
  chmod -R 755 $GODADDY_PATH
  find $GODADDY_PATH -type f -exec chmod 644 {} \;

  # Clean up
  echo "Cleaning up"
  rm /tmp/$DEPLOY_PACKAGE

  # Restart services if needed
  echo "Restarting services"
  # Add commands to restart any necessary services (e.g., Apache, Node.js, etc.)
  # Example: systemctl restart apache2
EOF

if [ $? -ne 0 ]; then
  echo -e "${RED}Deployment on the server failed.${NC}"
  exit 1
fi

# Clean up local deployment package
rm $DEPLOY_PACKAGE

echo -e "${GREEN}Deployment to GoDaddy web app (${GODADDY_HOST}) completed successfully!${NC}"