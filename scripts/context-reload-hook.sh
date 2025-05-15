#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONSOLIDATION_SCRIPT="$SCRIPT_DIR/memory-bank-consolidation.js"
CHECKPOINT_SCRIPT="$SCRIPT_DIR/update-context-checkpoint.js"
ENSURE_NODE_SCRIPT="$SCRIPT_DIR/ensure-node.sh"
LOG_FILE="$PROJECT_ROOT/logs/context-reload-hook.log"
CHECKPOINT_FILE="$PROJECT_ROOT/context/latest-checkpoint.md"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Log function
log() {
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] $1" >> "$LOG_FILE"
  echo "$1"
}

log "Context reload detected, checking checkpoint file..."

# Check if checkpoint file exists
if [ ! -f "$CHECKPOINT_FILE" ]; then
  log "❗ Checkpoint missing. Awaiting reinitialization."
  exit 1
fi

log "Checkpoint file found, proceeding with context reload..."

# Ensure Node.js is installed
if [ -f "$ENSURE_NODE_SCRIPT" ]; then
  log "Ensuring Node.js is installed..."
  source "$ENSURE_NODE_SCRIPT" >> "$LOG_FILE" 2>&1
fi

# Run consolidation script
log "Running memory bank consolidation..."
node "$CONSOLIDATION_SCRIPT" >> "$LOG_FILE" 2>&1

# Update the checkpoint file
log "Updating context checkpoint..."
node "$CHECKPOINT_SCRIPT" >> "$LOG_FILE" 2>&1

log "Context reload complete"
