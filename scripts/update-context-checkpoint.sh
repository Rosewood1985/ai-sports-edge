#!/bin/bash

# Context Checkpoint Update Script
# Updates the context checkpoint file based on specified triggers

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CHECKPOINT_SCRIPT="$SCRIPT_DIR/update-context-checkpoint.js"
ENSURE_NODE_SCRIPT="$SCRIPT_DIR/ensure-node.sh"
LOG_FILE="$PROJECT_ROOT/logs/context-checkpoint-update.log"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Log function
log() {
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] $1" >> "$LOG_FILE"
  echo "$1"
}

log "Starting context checkpoint update..."

# Ensure Node.js is installed
if [ -f "$ENSURE_NODE_SCRIPT" ]; then
  log "Ensuring Node.js is installed..."
  source "$ENSURE_NODE_SCRIPT" >> "$LOG_FILE" 2>&1
fi

# Make the script executable
chmod +x "$CHECKPOINT_SCRIPT"

# Run the checkpoint update script
node "$CHECKPOINT_SCRIPT"

# Check if the script ran successfully
if [ $? -eq 0 ]; then
  log "Context checkpoint update completed successfully"
else
  log "Error: Context checkpoint update failed"
  exit 1
fi

# Verify that the checkpoint file exists
CHECKPOINT_FILE="$PROJECT_ROOT/context/latest-checkpoint.md"
if [ ! -f "$CHECKPOINT_FILE" ]; then
  log "Error: Checkpoint file does not exist at $CHECKPOINT_FILE"
  log "❗ Checkpoint missing. Awaiting reinitialization."
  exit 1
fi

log "Context checkpoint system is ready"