#!/bin/bash
# Send daily brief with Founder's Executive Brief via email

DATE=$(date +"%Y-%m-%d")
LOG_DIR="/Users/lisadario/Desktop/ai-sports-edge/logs"

# Generate the daily brief (which includes the Executive Brief)
/Users/lisadario/Desktop/ai-sports-edge/notification-system/scripts/generate-daily-brief.sh

# Prepare email content
DAILY_BRIEF="/Users/lisadario/Desktop/ai-sports-edge/notification-system/reports/daily-brief-$DATE.md"
SUBJECT="AI Sports Edge Daily Brief + Executive Summary - $DATE"

# Read the daily brief content
if [ -f "$DAILY_BRIEF" ]; then
    BODY=$(cat "$DAILY_BRIEF")
    
    # Send the email with proper formatting
    /Users/lisadario/Desktop/ai-sports-edge/notification-system/scripts/send-gmail-secure.sh "$SUBJECT" "$BODY"
    
    echo "[$(date +"%Y-%m-%d %H:%M:%S")] Daily brief with Executive Brief sent to ai.sportsedgeapp@gmail.com" >> "$LOG_DIR/email-notifications.log"
    echo "[$(date +"%Y-%m-%d %H:%M:%S")] Daily brief sent successfully" >> "$LOG_DIR/daily-brief.log"
else
    echo "[$(date +"%Y-%m-%d %H:%M:%S")] ERROR: Daily brief file not found" >> "$LOG_DIR/daily-brief.log"
fi