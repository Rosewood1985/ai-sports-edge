#!/bin/bash

# Complete deployment script that ensures .htaccess is included
# This script fixes the critical issue where .htaccess was being excluded

echo "🚀 Starting complete deployment with .htaccess included..."

# Build the app
echo "📦 Building the app..."
npx expo export --platform web

# Check if build was successful
if [ ! -d "dist" ]; then
  echo "❌ Build failed. The dist directory was not created."
  exit 1
fi

# Verify .htaccess exists
if [ ! -f "dist/.htaccess" ]; then
  echo "⚠️ .htaccess file not found in dist directory. Creating it..."
  
  # Create .htaccess file with proper configuration
  cat > dist/.htaccess << 'EOL'
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
AddType application/json .json
AddType text/css .css

# Disable directory browsing
Options -Indexes

# Set default document
DirectoryIndex index.html
EOL

  echo "✅ .htaccess file created successfully"
fi

# Check if language-switcher.js is referenced in index.html and comment it out if needed
if grep -q '<script src="/language-switcher.js"></script>' dist/index.html; then
  echo "🔧 Commenting out reference to missing language-switcher.js file..."
  sed -i.bak 's|<script src="/language-switcher.js"></script>|<!-- <script src="/language-switcher.js"></script> -->|g' dist/index.html
  rm dist/index.html.bak
  echo "✅ Reference to language-switcher.js commented out"
fi

# Check if register-service-worker.js is referenced in index.html and comment it out if needed
if grep -q '<script src="/register-service-worker.js"></script>' dist/index.html; then
  echo "🔧 Commenting out reference to register-service-worker.js file..."
  sed -i.bak 's|<script src="/register-service-worker.js"></script>|<!-- <script src="/register-service-worker.js"></script> -->|g' dist/index.html
  rm dist/index.html.bak
  echo "✅ Reference to register-service-worker.js commented out"
fi

# Set deployment variables
REMOTE_HOST="sftp.aisportsedge.app"
REMOTE_USER="deploy@aisportsedge.app"
REMOTE_PATH="/home/q15133yvmhnq/public_html/aisportsedge.app"
LOCAL_DIR="./dist"

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

echo "🔍 Post-deployment verification checklist:"
echo "1. Visit https://aisportsedge.app in incognito mode or hard refresh"
echo "2. Ensure no reload loop"
echo "3. Ensure no integrity, MIME, or CSP errors in Console"
echo "4. Confirm Firebase authentication works"
echo "5. Verify language toggle works and Spanish text appears when selected"
echo ""
echo "✅ Deployment process completed!"