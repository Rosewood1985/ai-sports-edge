#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONSOLIDATION_SCRIPT="$SCRIPT_DIR/memory-bank-consolidation.js"
LOG_FILE="$PROJECT_ROOT/logs/command-interceptor.log"

# Get the command from stdin
read -r command

# Check if the command contains "consolidate"
if [[ "$command" == *"consolidate"* ]]; then
  # Run the consolidation script
  node "$CONSOLIDATION_SCRIPT" --verbose
fi

# Pass the command through
echo "$command"
