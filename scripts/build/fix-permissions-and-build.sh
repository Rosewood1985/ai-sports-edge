#!/bin/bash

# ROO DEPLOYMENT FIX SCRIPT
# 1. Fixes file permissions
# 2. Moves build files to root directory
# Assumes this is running in /home/q15133yvmhnq/public_html/aisportsedge.app

BUILD_DIR="build"
ROOT_DIR="/home/q15133yvmhnq/public_html/aisportsedge.app"

# 1. Ensure we're in the correct root directory
cd "$ROOT_DIR" || {
  echo "❌ Failed to access root directory: $ROOT_DIR"
  exit 1
}

echo "🔒 Fixing directory permissions..."
chmod -R 755 "$ROOT_DIR"

echo "🔒 Fixing file permissions..."
find "$ROOT_DIR" -type f -exec chmod 644 {} \;

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

# 4. Make scripts executable again
echo "🔒 Making scripts executable..."
find "$ROOT_DIR" -name "*.sh" -exec chmod +x {} \;

# 5. List important files to confirm success
echo "📂 Current root directory contents:"
ls -al $ROOT_DIR | grep -E 'index.html|\.htaccess|bundle\.js|styles\.css'

# 6. Recommend verifying in browser
echo -e "\n🔍 Now open https://aisportsedge.app in incognito mode to verify deployment.\n"
exit 0