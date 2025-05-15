#!/bin/bash
# Script to set up a cron job for daily executive brief generation
# Created: May 10, 2025

# Set variables
BASE_DIR="/Users/lisadario/Desktop/ai-sports-edge"
SCRIPT_PATH="$BASE_DIR/scripts/generate-executive-brief.sh"
LOG_FILE="$BASE_DIR/status/cron-setup.log"
CRON_TIME="0 8 * * *" # Run at 8:00 AM every day
CRON_ENTRY="$CRON_TIME $SCRIPT_PATH >> $BASE_DIR/logs/executive-brief.log 2>&1 # ai-sports-edge-daily-brief"
TEMP_CRON="/tmp/executive-brief-cron.txt"

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Function to create directory if it doesn't exist
ensure_directory() {
    if [ ! -d "$1" ]; then
        mkdir -p "$1"
        log_message "Created directory: $1"
    fi
}

# Function to set up cron job
setup_cron_job() {
    log_message "Setting up cron job for daily executive brief generation..."
    
    # Create temporary cron file
    echo "# ai-sports-edge-daily-brief" > "$TEMP_CRON"
    echo "$CRON_ENTRY" >> "$TEMP_CRON"
    
    # Check if cron job already exists
    if crontab -l | grep -q "ai-sports-edge-daily-brief"; then
        log_message "Cron job already exists. Updating..."
        
        # Get current crontab and remove existing entry
        crontab -l | grep -v "ai-sports-edge-daily-brief" > /tmp/current-cron
        
        # Append new entry
        cat "$TEMP_CRON" >> /tmp/current-cron
        
        # Install new crontab
        crontab /tmp/current-cron
        
        # Clean up
        rm /tmp/current-cron
    else
        log_message "Adding new cron job..."
        
        # Get current crontab
        crontab -l > /tmp/current-cron 2>/dev/null || echo "" > /tmp/current-cron
        
        # Append new entry
        cat "$TEMP_CRON" >> /tmp/current-cron
        
        # Install new crontab
        crontab /tmp/current-cron
        
        # Clean up
        rm /tmp/current-cron
    fi
    
    # Clean up temp file
    rm "$TEMP_CRON"
    
    log_message "Cron job set up successfully."
}

# Function to verify cron job
verify_cron_job() {
    log_message "Verifying cron job..."
    
    if crontab -l | grep -q "ai-sports-edge-daily-brief"; then
        log_message "Cron job verified successfully."
        return 0
    else
        log_message "Error: Cron job not found in crontab."
        return 1
    fi
}

# Function to create a launchd plist for macOS (alternative to cron)
setup_launchd() {
    log_message "Setting up launchd job for macOS..."
    
    # Create plist file
    PLIST_PATH="$HOME/Library/LaunchAgents/com.aisportsedge.dailybrief.plist"
    
    cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.aisportsedge.dailybrief</string>
    <key>ProgramArguments</key>
    <array>
        <string>$SCRIPT_PATH</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>8</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>$BASE_DIR/logs/executive-brief.log</string>
    <key>StandardErrorPath</key>
    <string>$BASE_DIR/logs/executive-brief.log</string>
</dict>
</plist>
EOF
    
    # Load the plist
    launchctl load "$PLIST_PATH"
    
    log_message "LaunchAgent created at $PLIST_PATH and loaded."
}

# Main execution
main() {
    log_message "Starting executive brief cron job setup..."
    
    ensure_directory "$(dirname "$LOG_FILE")"
    ensure_directory "$BASE_DIR/logs"
    
    # Check if script exists and is executable
    if [ ! -x "$SCRIPT_PATH" ]; then
        log_message "Error: Script $SCRIPT_PATH does not exist or is not executable."
        exit 1
    fi
    
    # Detect OS and set up appropriate scheduler
    if [[ "$OSTYPE" == "darwin"* ]]; then
        log_message "macOS detected, using launchd..."
        setup_launchd
    else
        log_message "Using cron scheduler..."
        setup_cron_job
        verify_cron_job
    fi
    
    log_message "Executive brief scheduling setup complete."
    
    # Print summary
    echo ""
    echo "=== Executive Brief Scheduling Summary ==="
    echo "Schedule: Daily at 8:00 AM"
    echo "Script: $SCRIPT_PATH"
    echo "Log File: $BASE_DIR/logs/executive-brief.log"
    echo "================================================"
    echo ""
    echo "The executive brief will be automatically generated each morning at 8:00 AM."
    echo "You can also generate it manually by running ./generate-executive-brief.command"
}

# Run the main function
main