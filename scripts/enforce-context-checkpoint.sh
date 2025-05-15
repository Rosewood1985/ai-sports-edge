#!/bin/bash

# Context Checkpoint Enforcement Script
# Enforces the behavior specified in the context checkpoint file

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CHECKPOINT_SCRIPT="$SCRIPT_DIR/enforce-context-checkpoint.js"
ENSURE_NODE_SCRIPT="$SCRIPT_DIR/ensure-node.sh"
LOG_FILE="$PROJECT_ROOT/logs/context-checkpoint-enforce.log"
CHECKPOINT_FILE="$PROJECT_ROOT/context/latest-checkpoint.md"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Log function
log() {
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] $1" >> "$LOG_FILE"
  echo "$1"
}

log "Starting context checkpoint enforcement..."

# Check if checkpoint file exists
if [ ! -f "$CHECKPOINT_FILE" ]; then
  log "❗ Checkpoint missing. Awaiting reinitialization."
  exit 1
fi

# Ensure Node.js is installed
if [ -f "$ENSURE_NODE_SCRIPT" ]; then
  log "Ensuring Node.js is installed..."
  source "$ENSURE_NODE_SCRIPT" >> "$LOG_FILE" 2>&1
fi

# Make the script executable
chmod +x "$CHECKPOINT_SCRIPT"

# Run the checkpoint enforcement script
node "$CHECKPOINT_SCRIPT"

# Check if the script ran successfully
if [ $? -eq 0 ]; then
  log "Context checkpoint enforcement completed successfully"
else
  log "Error: Context checkpoint enforcement failed"
  exit 1
fi

log "Context checkpoint system is ready"