#!/bin/bash
# setup_cron_job.sh
# Sets up a cron job for daily reminders

# Get the current directory
CURRENT_DIR=$(pwd)

# Create the cron job entry
CRON_ENTRY="0 9 * * * cd $CURRENT_DIR && ./scripts/project_assistant.sh > /tmp/project_reminder.log 2>&1"

# Check if the cron job already exists
if crontab -l 2>/dev/null | grep -q "$CURRENT_DIR.*project_assistant.sh"; then
  echo "Cron job already exists. Skipping..."
else
  # Add the cron job
  (crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -
  echo "Cron job added successfully!"
  echo "You will receive daily reminders at 9:00 AM"
fi

# Show all cron jobs
echo ""
echo "Current cron jobs:"
crontab -l