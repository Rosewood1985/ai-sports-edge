#!/bin/bash

# Script to reset VS Code workspace metadata and fix storage path issues
# This script addresses the "Custom storage path is unusable" error

echo "🔧 Resetting VS Code workspace metadata..."

# Ensure .vscode directory exists with proper permissions
if [ ! -d ".vscode" ]; then
  echo "Creating .vscode directory..."
  mkdir -p .vscode
fi

# Set proper permissions
echo "Setting proper permissions on project directory..."
chmod -R u+rwX .
chmod -R u+rwX .vscode

# Backup existing settings if they exist
if [ -f ".vscode/settings.json" ]; then
  echo "Backing up existing settings.json..."
  cp .vscode/settings.json .vscode/settings.json.bak
fi

# Backup existing sftp.json if it exists
if [ -f ".vscode/sftp.json" ]; then
  echo "Backing up existing sftp.json..."
  cp .vscode/sftp.json .vscode/sftp.json.bak
fi

# Copy SFTP configuration from vscode-sftp-deploy if it exists
if [ -f "vscode-sftp-deploy/.vscode/sftp.json" ]; then
  echo "Copying SFTP configuration from vscode-sftp-deploy..."
  cp vscode-sftp-deploy/.vscode/sftp.json .vscode/sftp.json
fi

# Create minimal settings.json if it doesn't exist
if [ ! -f ".vscode/settings.json" ]; then
  echo "Creating minimal settings.json..."
  cat > .vscode/settings.json << 'EOF'
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "javascript.updateImportsOnFileMove.enabled": "always",
  "typescript.updateImportsOnFileMove.enabled": "always",
  "files.exclude": {
    "**/.git": true,
    "**/.DS_Store": true,
    "**/node_modules": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/bower_components": true,
    "**/*.code-search": true
  }
}
EOF
fi

# Ensure code-workspace file is correct
if [ -f "ai-sports-edge.code-workspace" ]; then
  echo "Checking code-workspace file..."
  cat > ai-sports-edge.code-workspace << 'EOF'
{
  "folders": [
    {
      "path": "."
    }
  ],
  "settings": {}
}
EOF
fi

# Clear VS Code storage if it exists
VSCODE_STORAGE="$HOME/Library/Application Support/Code/User/workspaceStorage"
if [ -d "$VSCODE_STORAGE" ]; then
  echo "⚠️ Note: You may need to clear VS Code workspace storage manually at:"
  echo "   $VSCODE_STORAGE"
  echo "   This requires closing VS Code first."
fi

echo "✅ Workspace reset complete!"
echo ""
echo "🔍 If issues persist, try:"
echo "1. Close VS Code completely"
echo "2. Delete the workspace storage folder for this project"
echo "3. Reopen VS Code with: code ."
echo ""
echo "📋 Project root verified at: $(pwd)"