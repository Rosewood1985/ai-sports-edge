#!/bin/bash
# Setup Executive Brief Cron Command
# This command file makes it easy to set up the executive brief cron job

# Change to the project directory
cd "$(dirname "$0")"

echo "🧠 AI Sports Edge - Setting Up Executive Brief Scheduling..."
echo "=========================================================="

# Run the unified schedule setup script
./notification-system/scripts/setup-unified-schedule.sh

echo ""
echo "✅ Executive Brief scheduling setup complete!"
echo ""
echo "To activate the schedule, run:"
echo "crontab -e"
echo "Then add the contents of /tmp/unified-notification-cron.txt"
echo ""
echo "The Executive Brief will be generated at 6:50 AM and emailed at 7:00 AM daily."