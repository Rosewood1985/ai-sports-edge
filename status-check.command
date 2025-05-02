#!/bin/bash
LOGFILE=~/automation-logs/status-check.log
exec >> "$LOGFILE" 2>&1
echo "=== $(date) === Starting status-check ==="

echo ""
echo "📦 Git Status:"
cd ~/Desktop/ai-sports-edge || exit
git status

echo ""
echo "🔗 Git Remote:"
git remote -v

echo ""
echo "🕒 Cron Jobs:"
crontab -l

echo ""
echo "🤖 GPT Agent Summary:"
echo "- Olive: Active if task-board.md and md-update-summary.md are updating"
echo "- Roo: Active if command files are updating and Git commits appear"
echo "- Sloane: Active if Adobe Express tasks or image templates are syncing"
echo ""
echo "✅ Status check complete"
