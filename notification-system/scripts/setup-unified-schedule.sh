#!/bin/bash
# Set up unified schedule for Executive Brief and email notifications

# Create comprehensive cron entries
cat << CRON > /tmp/unified-notification-cron.txt
# AI Sports Edge Unified Notification System

# Executive Brief Generation - 6:50 AM (before email send)
50 6 * * * /Users/lisadario/Desktop/ai-sports-edge/scripts/generate-executive-brief.sh >> /Users/lisadario/Desktop/ai-sports-edge/logs/executive-brief.log 2>&1 # executive-brief-gen

# Daily Brief with Executive Brief - 7:00 AM
0 7 * * * /Users/lisadario/Desktop/ai-sports-edge/notification-system/scripts/send-daily-brief.sh >> /Users/lisadario/Desktop/ai-sports-edge/logs/daily-email.log 2>&1 # daily-brief-email

# All existing cron jobs from previous schedules...
$(cat /tmp/notification-cron.txt 2>/dev/null | grep -v "# AI Sports Edge")
CRON

echo "Unified schedule created. Review /tmp/unified-notification-cron.txt"
echo ""
echo "To activate, run:"
echo "crontab -e"
echo "Then add the contents of /tmp/unified-notification-cron.txt"