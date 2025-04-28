#!/bin/bash

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔒 Validating Deployment Configuration...${NC}"

# Define the root workspace
ROOT_WORKSPACE="/Users/lisadario/Desktop/ai-sports-edge"
SFTP_CONFIG_SYMLINK="$ROOT_WORKSPACE/.vscode/sftp.json"
SFTP_CONFIG_TARGET="$ROOT_WORKSPACE/vscode-sftp-deploy/.vscode/sftp.json"
BUILD_DIR="$ROOT_WORKSPACE/build"
HTACCESS_FILE="$BUILD_DIR/.htaccess"

# Check if we're in the correct root workspace
if [ "$PWD" != "$ROOT_WORKSPACE" ]; then
    echo -e "${RED}❌ Not in the correct root workspace${NC}"
    echo -e "${YELLOW}Current directory: $PWD${NC}"
    echo -e "${YELLOW}Expected directory: $ROOT_WORKSPACE${NC}"
    echo -e "${YELLOW}Changing to the correct directory...${NC}"
    cd "$ROOT_WORKSPACE" || {
        echo -e "${RED}❌ Failed to change to the correct directory${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ Changed to the correct directory${NC}"
fi

# Check if .vscode/sftp.json is a symlink pointing to vscode-sftp-deploy/.vscode/sftp.json
echo -e "${YELLOW}Checking if .vscode/sftp.json is a symlink...${NC}"
if [ -L "$SFTP_CONFIG_SYMLINK" ]; then
    TARGET=$(readlink "$SFTP_CONFIG_SYMLINK")
    if [[ "$TARGET" == *"vscode-sftp-deploy/.vscode/sftp.json"* ]]; then
        echo -e "${GREEN}✅ .vscode/sftp.json is a symlink pointing to vscode-sftp-deploy/.vscode/sftp.json${NC}"
    else
        echo -e "${RED}❌ .vscode/sftp.json is a symlink but points to $TARGET${NC}"
        echo -e "${YELLOW}Creating correct symlink...${NC}"
        rm "$SFTP_CONFIG_SYMLINK"
        ln -s "$SFTP_CONFIG_TARGET" "$SFTP_CONFIG_SYMLINK"
        echo -e "${GREEN}✅ Created correct symlink${NC}"
    fi
else
    echo -e "${RED}❌ .vscode/sftp.json is not a symlink${NC}"
    echo -e "${YELLOW}Creating symlink...${NC}"
    if [ -f "$SFTP_CONFIG_SYMLINK" ]; then
        mv "$SFTP_CONFIG_SYMLINK" "$SFTP_CONFIG_SYMLINK.bak"
        echo -e "${YELLOW}Backed up existing file to $SFTP_CONFIG_SYMLINK.bak${NC}"
    fi
    ln -s "$SFTP_CONFIG_TARGET" "$SFTP_CONFIG_SYMLINK"
    echo -e "${GREEN}✅ Created symlink${NC}"
fi

# Check if build directory exists
echo -e "${YELLOW}Checking if build directory exists...${NC}"
if [ -d "$BUILD_DIR" ]; then
    echo -e "${GREEN}✅ build directory exists${NC}"
else
    echo -e "${RED}❌ build directory does not exist${NC}"
    echo -e "${YELLOW}Please make sure the build directory exists before deploying${NC}"
    exit 1
fi

# Check if .htaccess exists in build directory
echo -e "${YELLOW}Checking if .htaccess exists in build directory...${NC}"
if [ -f "$HTACCESS_FILE" ]; then
    echo -e "${GREEN}✅ .htaccess exists in build directory${NC}"
else
    echo -e "${RED}❌ .htaccess does not exist in build directory${NC}"
    echo -e "${YELLOW}Creating default .htaccess file...${NC}"
    cat > "$HTACCESS_FILE" << 'EOF'
# Enable URL rewriting
RewriteEngine On

# Set base directory
RewriteBase /

# Handle SPA routing - redirect all requests to index.html except for files and directories
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [QSA,L]

# Set security headers
<IfModule mod_headers.c>
    # Enable CORS
    Header set Access-Control-Allow-Origin "*"
    
    # Prevent MIME type sniffing
    Header set X-Content-Type-Options "nosniff"
    
    # Enable XSS protection
    Header set X-XSS-Protection "1; mode=block"
    
    # Prevent clickjacking
    Header set X-Frame-Options "SAMEORIGIN"
    
    # Content Security Policy
    Header set Content-Security-Policy "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https: wss: ws:;"
    
    # Referrer Policy
    Header set Referrer-Policy "no-referrer-when-downgrade"
</IfModule>

# Enable gzip compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Set caching headers
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType text/javascript "access plus 1 month"
    ExpiresByType application/pdf "access plus 1 month"
    ExpiresByType text/html "access plus 1 day"
</IfModule>
EOF
    echo -e "${GREEN}✅ Created default .htaccess file${NC}"
fi

# Update SFTP configuration with correct credentials
echo -e "${YELLOW}Updating SFTP configuration with correct credentials...${NC}"
if [ -f "$SFTP_CONFIG_TARGET" ]; then
    # Create a temporary file
    TMP_FILE=$(mktemp)
    
    # Update the configuration
    cat "$SFTP_CONFIG_TARGET" | jq '.username = "deploy@aisportsedge.app" | .password = "hTQ3LQ]#P(b," | .remotePath = "/home/q15133yvmhnq/public_html/aisportsedge.app"' > "$TMP_FILE"
    
    # Check if jq command was successful
    if [ $? -eq 0 ]; then
        # Replace the original file
        mv "$TMP_FILE" "$SFTP_CONFIG_TARGET"
        echo -e "${GREEN}✅ Updated SFTP configuration with correct credentials${NC}"
    else
        echo -e "${RED}❌ Failed to update SFTP configuration${NC}"
        echo -e "${YELLOW}Please update the SFTP configuration manually:${NC}"
        echo -e "${YELLOW}  - Username: deploy@aisportsedge.app${NC}"
        echo -e "${YELLOW}  - Password: hTQ3LQ]#P(b,${NC}"
        echo -e "${YELLOW}  - Path: /home/q15133yvmhnq/public_html/aisportsedge.app${NC}"
        rm "$TMP_FILE"
    fi
else
    echo -e "${RED}❌ SFTP configuration file not found at $SFTP_CONFIG_TARGET${NC}"
    exit 1
fi

echo -e "\n${GREEN}✅ Deployment configuration validated successfully!${NC}"
echo -e "${YELLOW}Ready to deploy. Run ./scripts/automated-deploy-and-verify.sh to deploy.${NC}"