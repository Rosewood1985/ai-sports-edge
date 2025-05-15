#!/bin/bash

# Daily Recap Generator Script
# Generates a daily recap from batch-review.md and status-log.md

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
RECAP_SCRIPT="$SCRIPT_DIR/generate-daily-recap.js"
ENSURE_NODE_SCRIPT="$SCRIPT_DIR/ensure-node.sh"
LOG_FILE="$PROJECT_ROOT/logs/daily-recap.log"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Log function
log() {
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] $1" >> "$LOG_FILE"
  echo "$1"
}

log "Starting daily recap generation..."

# Check if it's 9 AM
CURRENT_HOUR=$(date +"%H")
if [ "$CURRENT_HOUR" -ne 9 ] && [ "$1" != "--force" ]; then
  log "Not 9 AM, skipping daily recap (use --force to override)"
  echo "ℹ️ Daily recap is scheduled for 9 AM. Use --force to generate now."
  exit 0
fi

# Ensure Node.js is installed
if [ -f "$ENSURE_NODE_SCRIPT" ]; then
  log "Ensuring Node.js is installed..."
  source "$ENSURE_NODE_SCRIPT" >> "$LOG_FILE" 2>&1
fi

# Make the script executable
chmod +x "$RECAP_SCRIPT"

# Run the daily recap generator
node "$RECAP_SCRIPT"

# Check if the script ran successfully
if [ $? -eq 0 ]; then
  log "Daily recap generated successfully"
else
  log "Error: Daily recap generation failed"
  exit 1
fi