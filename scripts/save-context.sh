#!/bin/bash

# Autosave Context Script
# This script is executed by cron every 3 minutes to ensure continuous preservation of development context

# Create logs directory if it doesn't exist
mkdir -p /workspaces/ai-sports-edge/logs

# Log start time
echo "🔄 Saving context at $(date)" >> /workspaces/ai-sports-edge/logs/autosave.log

# Try multiple possible Node.js binary locations
NODE_BIN=$(which node 2>/dev/null || which nodejs 2>/dev/null || echo "node")

# Run memory update if available
if [ -f /workspaces/ai-sports-edge/scripts/update-memory-bank.js ]; then
  echo "Running update-memory-bank.js..." >> /workspaces/ai-sports-edge/logs/autosave.log
  
  # Try to run with the detected Node.js binary
  if $NODE_BIN /workspaces/ai-sports-edge/scripts/update-memory-bank.js --force >> /workspaces/ai-sports-edge/logs/autosave.log 2>&1; then
    echo "Memory bank update completed at $(date)" >> /workspaces/ai-sports-edge/logs/autosave.log
  else
    echo "Node.js execution failed, falling back to bash solution..." >> /workspaces/ai-sports-edge/logs/autosave.log
    # Run the fallback script if Node.js fails
    if [ -f /workspaces/ai-sports-edge/scripts/fallback-context-save.sh ]; then
      bash /workspaces/ai-sports-edge/scripts/fallback-context-save.sh
    else
      echo "Error: fallback-context-save.sh not found" >> /workspaces/ai-sports-edge/logs/autosave.log
    fi
  fi
else
  echo "Error: update-memory-bank.js not found" >> /workspaces/ai-sports-edge/logs/autosave.log
  
  # Run the fallback script if the main script is not found
  if [ -f /workspaces/ai-sports-edge/scripts/fallback-context-save.sh ]; then
    bash /workspaces/ai-sports-edge/scripts/fallback-context-save.sh
  fi
fi

# Log completion
echo "✅ Context save completed" >> /workspaces/ai-sports-edge/logs/autosave.log
echo "-------------------------------------------" >> /workspaces/ai-sports-edge/logs/autosave.log

# Log to roo-observations.md
if [ -f /workspaces/ai-sports-edge/scripts/update-memory-bank.js ] && [ -f /workspaces/ai-sports-edge/scripts/log-cron-observation.sh ]; then
  # Check if there were any errors
  if grep -q "Error" /workspaces/ai-sports-edge/logs/autosave.log; then
    # Extract error message
    ERROR_MSG=$(grep "Error" /workspaces/ai-sports-edge/logs/autosave.log | tail -1)
    /workspaces/ai-sports-edge/scripts/log-cron-observation.sh --label "save-context" --status "warning" --message "$ERROR_MSG"
  else
    # Check if new content was discovered
    if grep -q "Memory bank update completed" /workspaces/ai-sports-edge/logs/autosave.log; then
      /workspaces/ai-sports-edge/scripts/log-cron-observation.sh --label "save-context" --status "success" --message "Context saved successfully. Memory bank updated."
    else
      /workspaces/ai-sports-edge/scripts/log-cron-observation.sh --label "save-context" --message "Context saved. No anomalies."
    fi
  fi
fi