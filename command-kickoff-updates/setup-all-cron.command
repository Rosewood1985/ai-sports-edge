#!/bin/bash

echo "🛠 Setting up all AI Sports Edge cron jobs..."

CRONTAB_ENTRY=$(crontab -l 2>/dev/null | grep -v "ai-sports-edge")

(
crontab -l 2>/dev/null | grep -v "ai-sports-edge"
echo "# ai-sports-edge commands"
echo "0 8 * * * ~/Desktop/ai-sports-edge/start-my-day.command # ai-sports-edge"
echo "0 12 * * * ~/Desktop/ai-sports-edge/save-and-wrap-midday.command # ai-sports-edge"
echo "0 17 * * * ~/Desktop/ai-sports-edge/daily-wrap-evening.command # ai-sports-edge"
echo "0 23 * * * ~/Desktop/ai-sports-edge/overnight-sync-late-night.command # ai-sports-edge"
echo "30 2 * * * ~/Desktop/ai-sports-edge/scripts/update-model.sh # ai-sports-edge"
echo "0 4 * * 0 ~/Desktop/ai-sports-edge/clean-database-weekly.command # ai-sports-edge"
) | crontab -

echo "✅ Cron jobs installed for AI Sports Edge."
