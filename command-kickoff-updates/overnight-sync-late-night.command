#!/bin/bash
echo "🌙 AI Sports Edge — 11:00 PM Overnight Sync"
echo ""
echo "📣 FOUNDER URGENT TASK BRIEF:"
echo "- Approve Sloane’s final copy"
echo "- Review model output from Rajiv"
echo "- Ensure next day’s kickoff and task list are ready"
echo ""

echo "📁 Running overnight model/data sync..."

if ! ./scripts/update-model.sh || ! ./scripts/data-integrity-check.sh; then
    echo "FAILED: Overnight sync script execution error" >> ~/Desktop/ai-sports-edge/cron-log.txt
    osascript -e 'display notification "Overnight sync failed" with title "AI Sports Edge"'
fi

TODAY=$(date +"%Y-%m-%d")
KICKOFF_PATH="$HOME/Desktop/ai-sports-edge/kickoffs/${TODAY}-kickoff.md"
open -a "Visual Studio Code" "$KICKOFF_PATH"
