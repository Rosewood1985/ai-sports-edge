#!/bin/bash

# Schedule docs_watchdog.py to run daily
# This script sets up a cron job to run the docs_watchdog.py script daily at 2 AM

# Get the absolute path to the project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT_PATH="$PROJECT_DIR/scripts/docs_watchdog.py"

# Check if the script exists
if [ ! -f "$SCRIPT_PATH" ]; then
    echo "❌ Error: docs_watchdog.py not found at $SCRIPT_PATH"
    exit 1
fi

# Create a temporary crontab file
TEMP_CRONTAB=$(mktemp)

# Export current crontab
crontab -l > "$TEMP_CRONTAB" 2>/dev/null || echo "" > "$TEMP_CRONTAB"

# Check if the job is already scheduled
if grep -q "docs_watchdog.py" "$TEMP_CRONTAB"; then
    echo "✅ docs_watchdog.py is already scheduled in crontab"
else
    # Add the new cron job to run at 2 AM daily
    echo "0 2 * * * cd $PROJECT_DIR && python3 $SCRIPT_PATH >> $PROJECT_DIR/logs/docs_watchdog.log 2>&1" >> "$TEMP_CRONTAB"
    
    # Create logs directory if it doesn't exist
    mkdir -p "$PROJECT_DIR/logs"
    
    # Install the new crontab
    crontab "$TEMP_CRONTAB"
    echo "✅ docs_watchdog.py scheduled to run daily at 2 AM"
fi

# Clean up
rm "$TEMP_CRONTAB"

echo "✅ Documentation watchdog automation complete"