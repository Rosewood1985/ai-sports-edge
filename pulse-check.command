#!/bin/bash

echo "📊 AI Sports Edge — Pulse Check"
echo "-------------------------------"

# Date and context
TODAY=$(date +"%Y-%m-%d")
KICKOFF="$HOME/Desktop/ai-sports-edge/kickoffs/${TODAY}-kickoff.md"
TASKS="$HOME/Desktop/ai-sports-edge/task-board.md"
FEATURES="$HOME/Desktop/ai-sports-edge/feature-log.md"
LOG="$HOME/Desktop/ai-sports-edge/cron-log.txt"
SUMMARY="$HOME/Desktop/ai-sports-edge/md-update-summary.md"

# Check kickoff file
echo ""
echo "📁 Kickoff File (${TODAY})"
if [ -f "$KICKOFF" ]; then
  echo "✅ Found: $KICKOFF"
else
  echo "❌ MISSING"
fi

# Check task board
echo ""
echo "📋 Task Board"
if [ -f "$TASKS" ]; then
  grep -E "^## ✅|^- \[Due" "$TASKS" | head -10
else
  echo "❌ task-board.md not found"
fi

# Check feature log
echo ""
echo "🧪 Feature Log Milestones"
if [ -f "$FEATURES" ]; then
  grep "^### ✅" "$FEATURES" | tail -5
else
  echo "❌ feature-log.md not found"
fi

# Check recent cron logs
echo ""
echo "📄 Last 5 Cron Log Entries"
if [ -f "$LOG" ]; then
  tail -n 5 "$LOG"
else
  echo "❌ cron-log.txt not found"
fi

# Show summary of .md updates
echo ""
echo "📎 Recently Synced .md Updates"
if [ -f "$SUMMARY" ]; then
  tail -n 20 "$SUMMARY"
else
  echo "❌ md-update-summary.md not found"
fi

echo ""
echo "💡 Tip: Check /Downloads for new files or run ./sync-md-updates.command manually if needed."
