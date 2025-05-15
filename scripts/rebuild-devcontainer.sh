#!/bin/bash

# rebuild-devcontainer.sh
# Script to rebuild the VS Code devcontainer after changes to Dockerfile or devcontainer.json
# Handles dotfiles integration to ensure consistent environment across rebuilds

echo "🔄 Rebuilding AI Sports Edge devcontainer..."

# Check if VS Code is running
if pgrep -x "Code" > /dev/null; then
  echo "⚠️ VS Code is currently running. Please close it before rebuilding the container."
  echo "   This prevents file lock issues during rebuild."
  exit 1
fi

# Navigate to project root (assuming script is run from anywhere in the project)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo "📁 Project root: $PROJECT_ROOT"

# Check for dotfiles directory
if [ -d "$PROJECT_ROOT/.dotfiles" ]; then
  echo "✅ Dotfiles directory found at $PROJECT_ROOT/.dotfiles"
else
  echo "⚠️ Dotfiles directory not found. This may affect environment setup after rebuild."
fi

# Clean up any existing container resources
# Note: We preserve the .dotfiles directory as it contains important configuration
echo "🧹 Cleaning up existing container resources..."
rm -rf .devcontainer/.vscode-server 2>/dev/null
rm -rf .devcontainer/node_modules 2>/dev/null

# Make sure dotfiles install script is executable
if [ -f "$PROJECT_ROOT/.dotfiles/install.sh" ]; then
  echo "🔧 Ensuring dotfiles install script is executable..."
  chmod +x "$PROJECT_ROOT/.dotfiles/install.sh"
fi

echo "✅ Cleanup complete."
echo "🚀 Ready to reopen VS Code with the rebuilt container."
echo "   Run: code $PROJECT_ROOT"

# Provide instructions for manual rebuild and dotfiles verification
echo ""
echo "ℹ️ After rebuilding the container:"
echo ""
echo "   1. Verify dotfiles installation by running:"
echo "      .dotfiles/install.sh && source ~/.bashrc"
echo ""
echo "   2. Confirm environment is properly set up by running:"
echo "      roo help"
echo ""
echo "ℹ️ If you need to force a full rebuild:"
echo "   1. Open VS Code"
echo "   2. Press F1 and run 'Dev Containers: Rebuild Container'"
echo "   3. After rebuild completes, run dotfiles installation verification"
echo ""