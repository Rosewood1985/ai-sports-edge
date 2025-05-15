#!/bin/bash

# Memory Bank Formatting Script Wrapper
# This script formats all memory bank files using Prettier.

# Set script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Ensure Node.js is installed using the ensure-node.sh script
echo "Ensuring Node.js is installed..."
source "$SCRIPT_DIR/ensure-node.sh"

# Make the JS script executable
chmod +x "$SCRIPT_DIR/format-memory-bank.js"

# Run the formatting script
echo "Running memory bank formatting script..."
node "$SCRIPT_DIR/format-memory-bank.js"

# Add to package.json scripts if not already present
if ! grep -q "\"format:memory-bank\":" "$PROJECT_ROOT/package.json"; then
  echo "Adding format:memory-bank script to package.json..."
  # Use a temporary file for the sed operation
  sed -i.bak '/\"scripts\": {/a \    \"format:memory-bank\": \"node scripts/format-memory-bank.js\",' "$PROJECT_ROOT/package.json"
  rm "$PROJECT_ROOT/package.json.bak"
  echo "Added format:memory-bank script to package.json."
fi

echo "Memory bank formatting complete!"