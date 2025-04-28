#!/bin/bash

# Reset Web Deploy Script for AI Sports Edge
# This script fully resets, cleans, and redeploys the production web app

echo "🚀 Starting full reset and redeployment of aisportsedge.app..."

# Load SFTP configuration from VS Code settings
if [ -f ".vscode/sftp.json" ]; then
  echo "📋 Loading SFTP configuration from .vscode/sftp.json..."
  
  # Extract values from sftp.json using grep and sed
  SFTP_HOST=$(grep -o '"host": *"[^"]*"' .vscode/sftp.json | sed 's/"host": *"\(.*\)"/\1/')
  SFTP_USER=$(grep -o '"username": *"[^"]*"' .vscode/sftp.json | sed 's/"username": *"\(.*\)"/\1/')
  SFTP_REMOTE_PATH=$(grep -o '"remotePath": *"[^"]*"' .vscode/sftp.json | sed 's/"remotePath": *"\(.*\)"/\1/')
  SFTP_PASSWORD=$(grep -o '"password": *"[^"]*"' .vscode/sftp.json | sed 's/"password": *"\(.*\)"/\1/')
  SFTP_PORT=$(grep -o '"port": *[0-9]*' .vscode/sftp.json | sed 's/"port": *\([0-9]*\)/\1/')
  
  echo "✅ Loaded SFTP configuration from .vscode/sftp.json"
else
  echo "❌ .vscode/sftp.json not found. Please set up SFTP configuration."
  exit 1
fi

# Create temporary script files
TEMP_CLEAN_SCRIPT=$(mktemp)
TEMP_UPLOAD_SCRIPT=$(mktemp)

echo "🧹 Creating cleanup script..."

# Create cleanup script
cat > $TEMP_CLEAN_SCRIPT << EOL
#!/bin/bash
# Connect to server and clean directory
cd $SFTP_REMOTE_PATH
echo "Connected to server, current directory: \$(pwd)"

# Backup .htaccess
echo "📦 Backing up .htaccess..."
if [ -f ".htaccess" ]; then
  cp .htaccess .htaccess.bak
  echo "✅ .htaccess backed up to .htaccess.bak"
else
  echo "⚠️ .htaccess not found, will create new one during deployment"
fi

# Backup logo if it exists
if [ -f "ai_logo_new.svg" ]; then
  echo "📦 Backing up logo..."
  cp ai_logo_new.svg ai_logo_new.svg.bak
  echo "✅ Logo backed up to ai_logo_new.svg.bak"
fi

# Remove all files except backups
echo "🧹 Removing all files except backups..."
find . -type f -not -name "*.bak" -not -name ".htaccess" -delete
find . -type d -not -path "." -not -path ".." | xargs rm -rf

echo "✅ Directory cleaned successfully"

# List remaining files
echo "📋 Remaining files:"
ls -la

exit
EOL

echo "🔄 Creating upload script..."

# Create upload script
cat > $TEMP_UPLOAD_SCRIPT << EOL
#!/bin/bash
# Connect to server and upload files
cd $SFTP_REMOTE_PATH
echo "Connected to server, current directory: \$(pwd)"

# Restore .htaccess if backup exists
if [ -f ".htaccess.bak" ]; then
  echo "📦 Restoring .htaccess from backup..."
  cp .htaccess.bak .htaccess
  echo "✅ .htaccess restored"
fi

# Restore logo if backup exists
if [ -f "ai_logo_new.svg.bak" ]; then
  echo "📦 Restoring logo from backup..."
  cp ai_logo_new.svg.bak ai_logo_new.svg
  echo "✅ Logo restored"
fi

# Update .htaccess with proper headers
echo "📝 Updating .htaccess with proper headers..."
cat > .htaccess << 'HTACCESS'
# Enable rewrite engine
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Redirect all requests to index.html except for files that exist
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^ index.html [L]
</IfModule>

# Set security headers
<IfModule mod_headers.c>
  Header set Content-Security-Policy "default-src 'self'; script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://www.gstatic.com 'unsafe-inline' 'unsafe-eval'; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.aisportsedge.com https://www.google-analytics.com https://firebaseinstallations.googleapis.com https://firebaseremoteconfig.googleapis.com https://firestore.googleapis.com; frame-src 'self' https://accounts.google.com https://aisportsedge.firebaseapp.com; object-src 'none'"
  Header set X-XSS-Protection "1; mode=block"
  Header set X-Content-Type-Options "nosniff"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
  Header set Permissions-Policy "camera=(), microphone=(), geolocation=(self), interest-cohort=()"
  Header set X-Frame-Options "SAMEORIGIN"
</IfModule>

# Enable CORS
<IfModule mod_headers.c>
  Header set Access-Control-Allow-Origin "*"
  Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
  Header set Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept"
</IfModule>

# Set default character set
AddDefaultCharset UTF-8

# Fix MIME type issues
AddType application/javascript .js .mjs
AddType text/css .css
AddType application/json .json

# Disable directory browsing
Options -Indexes

# Set default document
DirectoryIndex index.html
HTACCESS

echo "✅ .htaccess updated successfully"

exit
EOL

# Make scripts executable
chmod +x $TEMP_CLEAN_SCRIPT
chmod +x $TEMP_UPLOAD_SCRIPT

echo "🧹 Step 1: Cleaning remote directory..."

# Execute cleanup script on server
if [ ! -z "$SFTP_PASSWORD" ]; then
  # Use sshpass if password is provided
  sshpass -p "$SFTP_PASSWORD" ssh -p ${SFTP_PORT:-22} $SFTP_USER@$SFTP_HOST 'bash -s' < $TEMP_CLEAN_SCRIPT
else
  # Use SSH key
  ssh -p ${SFTP_PORT:-22} $SFTP_USER@$SFTP_HOST 'bash -s' < $TEMP_CLEAN_SCRIPT
fi

echo "🔄 Step 2: Uploading new files from dist directory..."

# Check if dist directory exists
if [ ! -d "./dist" ]; then
  echo "❌ dist directory not found. Please run 'npx expo export --platform web' first."
  exit 1
fi

# Upload dist directory contents
if [ ! -z "$SFTP_PASSWORD" ]; then
  # Use sshpass if password is provided
  sshpass -p "$SFTP_PASSWORD" scp -r -P ${SFTP_PORT:-22} ./dist/* $SFTP_USER@$SFTP_HOST:$SFTP_REMOTE_PATH/
else
  # Use SSH key
  scp -r -P ${SFTP_PORT:-22} ./dist/* $SFTP_USER@$SFTP_HOST:$SFTP_REMOTE_PATH/
fi

echo "📝 Step 3: Updating .htaccess and restoring backups..."

# Execute upload script on server
if [ ! -z "$SFTP_PASSWORD" ]; then
  # Use sshpass if password is provided
  sshpass -p "$SFTP_PASSWORD" ssh -p ${SFTP_PORT:-22} $SFTP_USER@$SFTP_HOST 'bash -s' < $TEMP_UPLOAD_SCRIPT
else
  # Use SSH key
  ssh -p ${SFTP_PORT:-22} $SFTP_USER@$SFTP_HOST 'bash -s' < $TEMP_UPLOAD_SCRIPT
fi

# Clean up temporary scripts
rm $TEMP_CLEAN_SCRIPT
rm $TEMP_UPLOAD_SCRIPT

echo "🔍 Step 4: Running post-deployment verification..."

# Run Lighthouse audit if available
if command -v lighthouse &> /dev/null; then
  echo "📊 Running Lighthouse audit..."
  lighthouse https://aisportsedge.app --output=html --output-path=./health-report/lighthouse-$(date +%Y%m%d%H%M%S).html --chrome-flags="--headless --no-sandbox"
else
  echo "⚠️ Lighthouse not installed. Skipping audit."
  echo "   Install with: npm install -g lighthouse"
fi

echo "✅ Deployment complete! Please verify the following:"
echo "1. Visit https://aisportsedge.app in incognito mode"
echo "2. Check for console errors (CSP, MIME, integrity)"
echo "3. Verify routing and language toggle functionality"
echo "4. Confirm Firebase auth loads without redirect loop"
echo "5. Verify service worker is loaded with correct MIME type"

echo ""
echo "📋 If issues persist, run:"
echo "   ./scripts/verify-deployment-health.sh"