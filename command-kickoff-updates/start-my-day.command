#!/bin/bash
echo "☀️  AI Sports Edge — 8:00 AM Kickoff"
echo ""
echo "📣 FOUNDER URGENT TASK BRIEF:"
echo "- Approve Sloane’s overnight social drafts"
echo "- Review Camille’s A/B test findings and CTA revisions"
echo "- Confirm any payout anomalies flagged by Clarke"
echo "- Look for red flags from Rajiv’s 2:30 AM model run"
echo ""

echo "🔄 Loading today's kickoff..."
TODAY=$(date +"%Y-%m-%d")
KICKOFF_PATH="$HOME/Desktop/ai-sports-edge/kickoffs/${TODAY}-kickoff.md"

if [ -f "$KICKOFF_PATH" ]; then
    cat "$KICKOFF_PATH"
else
    echo "❗ Kickoff file not found for today."
    echo "FAILED: Kickoff file missing" >> ~/Desktop/ai-sports-edge/cron-log.txt
fi

open -a "Visual Studio Code" "$KICKOFF_PATH"
open -a "Visual Studio Code" ~/Desktop/ai-sports-edge/task-board.md
open -a "Visual Studio Code" ~/Desktop/ai-sports-edge/feature-log.md
