#!/bin/bash

# Script to install the VS Code SFTP extension
# Using the maintained version by @Natizyskunk (Forked from liximomo's SFTP plugin)

echo "🔍 Checking for SFTP extension..."

# Check if the extension is already installed
if code --list-extensions | grep -q "natizyskunk.sftp"; then
  echo "✅ SFTP extension is already installed."
else
  echo "❌ SFTP extension is not installed."
  
  echo "📦 Installing the maintained SFTP extension by @Natizyskunk..."
  code --install-extension natizyskunk.sftp
  
  if [ $? -eq 0 ]; then
    echo "✅ SFTP extension installed successfully."
  else
    echo "❌ Failed to install SFTP extension from marketplace."
    echo "Please install it manually from the VS Code marketplace:"
    echo "1. Open VS Code"
    echo "2. Go to Extensions (Ctrl+Shift+X or Cmd+Shift+X)"
    echo "3. Search for 'SFTP'"
    echo "4. Install the extension by @Natizyskunk"
    echo "   (Look for 'SFTP - maintained by @Natizyskunk')"
  fi
fi

echo ""
echo "🔄 After installing the extension, you may need to restart VS Code."
echo "Then you can use the 'SFTP: Upload Folder' option by right-clicking on the dist folder."