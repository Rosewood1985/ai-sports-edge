#!/bin/bash
echo "🌞 AI Sports Edge — 12:00 PM Midday Check-in"
echo ""
echo "📣 FOUNDER URGENT TASK BRIEF:"
echo "- Review Camille’s CTA changes"
echo "- Verify Stripe sync from Clarke"
echo "- Follow up on i18n updates from Lucía"
echo ""

echo "🔄 Reading current task status..."
TODAY=$(date +"%Y-%m-%d")
KICKOFF_PATH="$HOME/Desktop/ai-sports-edge/kickoffs/${TODAY}-kickoff.md"

if [ -f "$KICKOFF_PATH" ]; then
    cat "$KICKOFF_PATH"
else
    echo "❗ Kickoff file not found for today."
    echo "FAILED: Midday kickoff file missing" >> ~/Desktop/ai-sports-edge/cron-log.txt
fi

open -a "Visual Studio Code" "$KICKOFF_PATH"
open -a "Visual Studio Code" ~/Desktop/ai-sports-edge/task-board.md
open -a "Visual Studio Code" ~/Desktop/ai-sports-edge/feature-log.md
