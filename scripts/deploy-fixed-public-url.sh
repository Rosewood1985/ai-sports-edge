#!/bin/bash

# Complete deployment script with fixed public URL and .htaccess inclusion
# This script implements all the steps from the Roo task

echo "🚀 Starting complete deployment with fixed public URL and .htaccess included..."

# STEP 1: Set the correct public URL in package.json
echo "📝 Setting correct public URL in package.json..."

# Check if package.json exists
if [ ! -f "package.json" ]; then
  echo "❌ package.json not found. Cannot set public URL."
  exit 1
fi

# Backup package.json
cp package.json package.json.bak

# Add or update homepage field in package.json
if grep -q '"homepage"' package.json; then
  # Update existing homepage field
  sed -i.tmp 's|"homepage": "[^"]*"|"homepage": "https://aisportsedge.app/"|g' package.json
  rm package.json.tmp
else
  # Add homepage field before the last closing brace
  sed -i.tmp '/"name"/a \ \ "homepage": "https://aisportsedge.app/",' package.json
  rm package.json.tmp
fi

echo "✅ Public URL set to https://aisportsedge.app/"

# STEP 2: Rebuild the frontend
echo "🔨 Rebuilding the frontend..."
npm run build

# Check if build was successful
if [ ! -d "build" ]; then
  echo "❌ Build failed. The build directory was not created."
  exit 1
fi

echo "✅ Frontend rebuilt successfully"

# STEP 3: Ensure .htaccess exists in the build directory
echo "📋 Checking for .htaccess in build directory..."

if [ ! -f "build/.htaccess" ]; then
  echo "📝 Creating .htaccess file..."
  
  # Create .htaccess file with proper configuration
  cat > build/.htaccess << 'EOL'
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
  Header set Content-Security-Policy "default-src 'self'; script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://www.gstatic.com https://js.stripe.com https://cdn.jsdelivr.net 'unsafe-inline' 'unsafe-eval'; style-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'; font-src 'self'; img-src 'self' data: https:; connect-src 'self' https://api.aisportsedge.com https://www.google-analytics.com https://firebaseinstallations.googleapis.com https://firebaseremoteconfig.googleapis.com https://firestore.googleapis.com; frame-src 'self' https://accounts.google.com https://aisportsedge.firebaseapp.com; object-src 'none'"
  Header set X-XSS-Protection "1; mode=block"
  Header set X-Content-Type-Options "nosniff"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
  Header set Permissions-Policy "camera=(), microphone=(), geolocation=()"
  Header set X-Frame-Options "SAMEORIGIN"
</IfModule>

# Set default character set
AddDefaultCharset UTF-8

# Fix MIME type issues
AddType application/javascript .js .mjs
AddType application/json .json
AddType text/css .css

# Disable directory browsing
Options -Indexes

# Set default document
DirectoryIndex index.html
EOL

  echo "✅ .htaccess file created successfully"
else
  echo "✅ .htaccess file already exists in build directory"
fi

# STEP 4: Check if missing script references need to be commented out in index.html
echo "🔍 Checking index.html for missing script references..."

if grep -q '<script src="/register-service-worker.js"></script>' build/index.html; then
  echo "🔧 Commenting out reference to missing register-service-worker.js file..."
  sed -i.bak 's|<script src="/register-service-worker.js"></script>|<!-- <script src="/register-service-worker.js"></script> -->|g' build/index.html
  rm build/index.html.bak
  echo "✅ Reference to register-service-worker.js commented out"
fi

if grep -q '<script src="/language-switcher.js"></script>' build/index.html; then
  echo "🔧 Commenting out reference to missing language-switcher.js file..."
  sed -i.bak 's|<script src="/language-switcher.js"></script>|<!-- <script src="/language-switcher.js"></script> -->|g' build/index.html
  rm build/index.html.bak
  echo "✅ Reference to language-switcher.js commented out"
fi

# STEP 5: Deploy to server
echo "🚀 Deploying to server..."

# Set deployment variables
REMOTE_HOST="sftp.aisportsedge.app"
REMOTE_USER="deploy@aisportsedge.app"
REMOTE_PATH="/home/q15133yvmhnq/public_html/aisportsedge.app"
LOCAL_DIR="./build"

# Extract credentials from VS Code SFTP config if available
if [ -f "vscode-sftp-deploy/.vscode/sftp.json" ]; then
  echo "📋 Loading credentials from VS Code SFTP configuration..."
  
  REMOTE_HOST=$(grep -o '"host": *"[^"]*"' vscode-sftp-deploy/.vscode/sftp.json | sed 's/"host": *"\(.*\)"/\1/')
  REMOTE_USER=$(grep -o '"username": *"[^"]*"' vscode-sftp-deploy/.vscode/sftp.json | sed 's/"username": *"\(.*\)"/\1/')
  REMOTE_PASSWORD=$(grep -o '"password": *"[^"]*"' vscode-sftp-deploy/.vscode/sftp.json | sed 's/"password": *"\(.*\)"/\1/')
  REMOTE_PATH=$(grep -o '"remotePath": *"[^"]*"' vscode-sftp-deploy/.vscode/sftp.json | sed 's/"remotePath": *"\(.*\)"/\1/')
  
  echo "✅ Credentials loaded from VS Code SFTP configuration"
fi

echo "📋 Deployment configuration:"
echo "Host: $REMOTE_HOST"
echo "User: $REMOTE_USER"
echo "Remote path: $REMOTE_PATH"
echo "Local directory: $LOCAL_DIR"

# Deploy using rsync if available
if command -v rsync &> /dev/null; then
  echo "🔄 Deploying with rsync (including .htaccess)..."
  
  # Create a temporary script for rsync deployment
  TEMP_SCRIPT=$(mktemp)
  
  # Write deployment script
  cat > $TEMP_SCRIPT << EOL
#!/bin/bash
rsync -av --include=".htaccess" $LOCAL_DIR/ $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/
EOL
  
  # Make script executable
  chmod +x $TEMP_SCRIPT
  
  # Run the script
  $TEMP_SCRIPT
  
  # Check if deployment was successful
  if [ $? -eq 0 ]; then
    echo "✅ Deployment completed successfully with rsync!"
  else
    echo "❌ Rsync deployment failed. Trying alternative method..."
    
    # Try alternative method with scp
    echo "🔄 Deploying with scp..."
    
    # Create a temporary script for scp deployment
    TEMP_SCP_SCRIPT=$(mktemp)
    
    # Write deployment script
    cat > $TEMP_SCP_SCRIPT << EOL
#!/bin/bash
cd $LOCAL_DIR
scp -r * .htaccess $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/
EOL
    
    # Make script executable
    chmod +x $TEMP_SCP_SCRIPT
    
    # Run the script
    $TEMP_SCP_SCRIPT
    
    # Check if deployment was successful
    if [ $? -eq 0 ]; then
      echo "✅ Deployment completed successfully with scp!"
    else
      echo "❌ Both deployment methods failed."
      echo "Please manually upload the files using VS Code SFTP extension."
      echo "Make sure to include the .htaccess file!"
    fi
    
    # Clean up
    rm $TEMP_SCP_SCRIPT
  fi
  
  # Clean up
  rm $TEMP_SCRIPT
else
  echo "⚠️ rsync not found, trying direct deployment with scp..."
  
  # Create a temporary script for scp deployment
  TEMP_SCRIPT=$(mktemp)
  
  # Write deployment script
  cat > $TEMP_SCRIPT << EOL
#!/bin/bash
cd $LOCAL_DIR
scp -r * .htaccess $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/
EOL
  
  # Make script executable
  chmod +x $TEMP_SCRIPT
  
  # Run the script
  $TEMP_SCRIPT
  
  # Check if deployment was successful
  if [ $? -eq 0 ]; then
    echo "✅ Deployment completed successfully with scp!"
  else
    echo "❌ Deployment failed. Please manually upload the files using VS Code SFTP extension."
    echo "Make sure to include the .htaccess file!"
  fi
  
  # Clean up
  rm $TEMP_SCRIPT
fi

# STEP 6: Verification instructions
echo "🔍 Post-deployment verification checklist:"
echo "1. Visit https://aisportsedge.app in incognito mode or hard refresh"
echo "2. Ensure no reload loop"
echo "3. Ensure no integrity, MIME, or CSP errors in Console"
echo "4. Confirm static assets load with 200 OK status"
echo "5. Verify Firebase authentication works"
echo "6. Test language toggle functionality"
echo ""
echo "✅ Deployment process completed!"

# Restore package.json backup if needed
read -p "Do you want to restore the original package.json? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  mv package.json.bak package.json
  echo "✅ Original package.json restored"
else
  echo "✅ Keeping modified package.json with homepage set to https://aisportsedge.app/"
  rm package.json.bak
fi