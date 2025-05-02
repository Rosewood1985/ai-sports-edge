#!/bin/bash

(
crontab -l 2>/dev/null | grep -v "ai-sports-edge-notify"
echo "# ai-sports-edge-notify"
echo "1 8 * * * ~/Desktop/ai-sports-edge/daily-notify.command # ai-sports-edge-notify"
) | crontab -

echo "✅ Notification cron job installed for 8:01 AM daily."
