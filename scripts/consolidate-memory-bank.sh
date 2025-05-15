#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONSOLIDATION_SCRIPT="$SCRIPT_DIR/memory-bank-consolidation.js"
ENSURE_NODE_SCRIPT="$SCRIPT_DIR/ensure-node.sh"

# Ensure Node.js is installed
if [ -f "$ENSURE_NODE_SCRIPT" ]; then
  echo "Ensuring Node.js is installed..."
  source "$ENSURE_NODE_SCRIPT"
fi

echo "Running memory bank consolidation..."
node "$CONSOLIDATION_SCRIPT" "$@"
echo "Consolidation complete!"
