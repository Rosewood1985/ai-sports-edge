#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MEMORY_BANK_DIR="$PROJECT_ROOT/memory-bank"
LAST_FILES_LIST="$MEMORY_BANK_DIR/.last-files-list"
CONSOLIDATION_SCRIPT="$SCRIPT_DIR/memory-bank-consolidation.js"
ENSURE_NODE_SCRIPT="$SCRIPT_DIR/ensure-node.sh"
LOG_FILE="$PROJECT_ROOT/logs/memory-bank-watcher.log"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Log function
log() {
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] $1" >> "$LOG_FILE"
}

# Get current list of files
current_files=$(find "$MEMORY_BANK_DIR" -name "*.md" | sort)

# If last files list doesn't exist, create it
if [ ! -f "$LAST_FILES_LIST" ]; then
  echo "$current_files" > "$LAST_FILES_LIST"
  log "Initialized last files list"
  exit 0
fi

# Get last files list
last_files=$(cat "$LAST_FILES_LIST")

# Compare file counts
last_count=$(echo "$last_files" | wc -l)
current_count=$(echo "$current_files" | wc -l)

# If file count has increased, run consolidation
if [ "$current_count" -gt "$last_count" ]; then
  log "New files detected in memory bank (was: $last_count, now: $current_count)"
  log "Running consolidation script..."
  
  # Ensure Node.js is installed
  if [ -f "$ENSURE_NODE_SCRIPT" ]; then
    log "Ensuring Node.js is installed..."
    source "$ENSURE_NODE_SCRIPT" >> "$LOG_FILE" 2>&1
  fi
  
  # Run consolidation script
  node "$CONSOLIDATION_SCRIPT" >> "$LOG_FILE" 2>&1
  
  log "Consolidation complete"
fi

# Update last files list
echo "$current_files" > "$LAST_FILES_LIST"
