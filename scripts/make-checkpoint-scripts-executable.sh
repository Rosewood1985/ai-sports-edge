#!/bin/bash

# Make Context Checkpoint Scripts Executable
# This script makes all the context checkpoint scripts executable

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_ROOT/logs/checkpoint-scripts-setup.log"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Log function
log() {
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] $1" >> "$LOG_FILE"
  echo "$1"
}

log "Making context checkpoint scripts executable..."

# List of scripts to make executable
SCRIPTS=(
  "$SCRIPT_DIR/update-context-checkpoint.js"
  "$SCRIPT_DIR/update-context-checkpoint.sh"
  "$SCRIPT_DIR/enforce-context-checkpoint.js"
  "$SCRIPT_DIR/enforce-context-checkpoint.sh"
  "$SCRIPT_DIR/start-session-with-checkpoint.sh"
  "$SCRIPT_DIR/generate-daily-recap.js"
  "$SCRIPT_DIR/generate-daily-recap.sh"
  "$SCRIPT_DIR/setup-daily-recap-cron.sh"
)

# Make each script executable
for script in "${SCRIPTS[@]}"; do
  if [ -f "$script" ]; then
    chmod +x "$script"
    log "Made executable: $script"
  else
    log "Warning: Script not found: $script"
  fi
done

log "All context checkpoint scripts are now executable"
echo "✅ All context checkpoint scripts are now executable"