#!/bin/bash

# Setup Daily Recap Cron Job
# Sets up a cron job to run the daily recap generator at 9 AM

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DAILY_RECAP_SCRIPT="$SCRIPT_DIR/generate-daily-recap.sh"
LOG_FILE="$PROJECT_ROOT/logs/cron-setup.log"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Log function
log() {
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] $1" >> "$LOG_FILE"
  echo "$1"
}

log "Setting up daily recap cron job..."

# Make the script executable
chmod +x "$DAILY_RECAP_SCRIPT"

# Create a temporary file for the crontab
TEMP_CRONTAB=$(mktemp)

# Export the current crontab
crontab -l > "$TEMP_CRONTAB" 2>/dev/null || true

# Check if the cron job already exists
if grep -q "generate-daily-recap.sh" "$TEMP_CRONTAB"; then
  log "Daily recap cron job already exists"
else
  # Add the cron job to run at 9 AM
  echo "0 9 * * * $DAILY_RECAP_SCRIPT >> $PROJECT_ROOT/logs/daily-recap-cron.log 2>&1" >> "$TEMP_CRONTAB"
  
  # Install the new crontab
  crontab "$TEMP_CRONTAB"
  
  if [ $? -eq 0 ]; then
    log "Daily recap cron job set up successfully"
    echo "✅ Daily recap cron job set up to run at 9 AM"
  else
    log "Error: Failed to set up daily recap cron job"
    echo "❌ Failed to set up daily recap cron job"
    rm "$TEMP_CRONTAB"
    exit 1
  fi
fi

# Clean up
rm "$TEMP_CRONTAB"

log "Cron job setup complete"

# Display the current crontab
echo "Current crontab:"
crontab -l