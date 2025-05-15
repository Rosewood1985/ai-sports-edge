#!/bin/bash

# Start Session with Context Checkpoint
# This script initializes a new session with the context checkpoint system.
# It checks for the existence of the checkpoint file and enforces it.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENFORCE_SCRIPT="$SCRIPT_DIR/enforce-context-checkpoint.sh"
UPDATE_SCRIPT="$SCRIPT_DIR/update-context-checkpoint.sh"
CHECKPOINT_FILE="$PROJECT_ROOT/context/latest-checkpoint.md"
LOG_FILE="$PROJECT_ROOT/logs/session-initialization.log"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Log function
log() {
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] $1" >> "$LOG_FILE"
  echo "$1"
}

log "Starting new session with context checkpoint..."

# Check if checkpoint file exists
if [ ! -f "$CHECKPOINT_FILE" ]; then
  log "❗ Checkpoint missing. Awaiting reinitialization."
  exit 1
fi

# Make scripts executable
chmod +x "$ENFORCE_SCRIPT"
chmod +x "$UPDATE_SCRIPT"

# Update the checkpoint file first
log "Updating context checkpoint..."
"$UPDATE_SCRIPT"

# Enforce the checkpoint
log "Enforcing context checkpoint..."
"$ENFORCE_SCRIPT"

# Check if enforcement was successful
if [ $? -eq 0 ]; then
  log "Session initialized successfully with context checkpoint"
  echo "✅ Session initialized with context checkpoint"
  echo "🔁 Primary mode and behavior flags are now in effect"
else
  log "Error: Failed to initialize session with context checkpoint"
  echo "❌ Failed to initialize session with context checkpoint"
  exit 1
fi

# Display a reminder about the daily recap
CURRENT_HOUR=$(date +"%H")
if [ "$CURRENT_HOUR" -eq 9 ]; then
  echo "🔔 Daily Recap Reminder: It's 9 AM, time for your daily recap!"
  echo "   Please check batch-review.md and status-log.md for updates."
fi