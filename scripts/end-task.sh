#!/bin/bash

# Script to run at the end of each major task
# Usage: /workspaces/ai-sports-edge/scripts/end-task.sh "Completed migration of batch 3"

COMMENT=$1
if [ -z "$COMMENT" ]; then
  echo "Please provide a comment describing what was completed"
  exit 1
fi

# Take a context snapshot
/workspaces/ai-sports-edge/scripts/snapshot-context.sh "$COMMENT"

echo "Task completed: $COMMENT"
echo ""
echo "IMPORTANT REMINDERS:"
echo "1. Update the master context with your progress"
echo "2. Commit your changes to git"
echo "3. If starting a new task, clearly document the next steps"