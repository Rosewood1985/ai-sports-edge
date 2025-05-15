#!/bin/bash
# Script to set up cron job for monthly GPT instruction review

# Set variables
BASE_DIR="/Users/lisadario/Desktop/ai-sports-edge"
LOG_FILE="$BASE_DIR/status/cron-setup.log"
CRON_ENTRY="0 1 1 * * $BASE_DIR/scripts/review-gpt-instructions.sh >> $BASE_DIR/logs/gpt-review.log 2>&1 # ai-sports-edge-gpt-monthly-review"
TEMP_CRON="/tmp/gpt-cron-entry.txt"

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
    log_message "Setting up cron job for monthly GPT instruction review..."
    
    # Create temporary cron file
    echo "# ai-sports-edge-gpt-review" > "$TEMP_CRON"
    echo "$CRON_ENTRY" >> "$TEMP_CRON"
    
    # Check if cron job already exists
    if crontab -l | grep -q "ai-sports-edge-gpt-monthly-review"; then
        log_message "Cron job already exists. Updating..."
        
        # Get current crontab and remove existing entry
        crontab -l | grep -v "ai-sports-edge-gpt" > /tmp/current-cron
        
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
    
    if crontab -l | grep -q "ai-sports-edge-gpt-monthly-review"; then
        log_message "Cron job verified successfully."
        return 0
    else
        log_message "Error: Cron job not found in crontab."
        return 1
    fi
}

# Main execution
main() {
    log_message "Starting GPT review cron job setup..."
    
    # Ensure log directory exists
    ensure_directory "$(dirname "$LOG_FILE")"
    ensure_directory "$BASE_DIR/logs"
    
    # Set up cron job
    setup_cron_job
    
    # Verify cron job
    if verify_cron_job; then
        log_message "GPT review cron job setup complete."
        
        # Print summary
        echo ""
        echo "=== GPT Review Cron Job Setup Summary ==="
        echo "Cron Schedule: At 1:00 AM on the 1st of every month"
        echo "Review Script: $BASE_DIR/scripts/review-gpt-instructions.sh"
        echo "Log File: $BASE_DIR/logs/gpt-review.log"
        echo "================================================"
    else
        log_message "Error: GPT review cron job setup failed."
        exit 1
    fi
}

# Run the main function
main