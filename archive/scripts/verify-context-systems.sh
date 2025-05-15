# ARCHIVED: This script has been consolidated into system-health-check.sh
# Archived on: 2025-05-13T20:54:19Z

#!/bin/bash

# Context Systems Verification Script
# This script checks the health of both primary and fallback context saving systems
# It creates a status report and can trigger the fallback system if needed

# Create logs directory if it doesn't exist
mkdir -p /workspaces/ai-sports-edge/logs

# Log start
echo "🔍 Verifying context saving systems at $(date)" >> /workspaces/ai-sports-edge/logs/autosave.log

# Check primary system (Node.js)
NODE_BIN=$(which node 2>/dev/null || which nodejs 2>/dev/null || echo "")
if [ -n "$NODE_BIN" ] && [ -f /workspaces/ai-sports-edge/scripts/update-memory-bank.js ]; then
  echo "✅ Primary system (Node.js): AVAILABLE" >> /workspaces/ai-sports-edge/logs/autosave.log
  PRIMARY_STATUS="available"
else
  echo "❌ Primary system (Node.js): NOT AVAILABLE" >> /workspaces/ai-sports-edge/logs/autosave.log
  PRIMARY_STATUS="unavailable"
fi

# Check fallback system
if [ -f /workspaces/ai-sports-edge/scripts/fallback-context-save.sh ] && [ -x /workspaces/ai-sports-edge/scripts/fallback-context-save.sh ]; then
  echo "✅ Fallback system: AVAILABLE" >> /workspaces/ai-sports-edge/logs/autosave.log
  FALLBACK_STATUS="available"
else
  echo "❌ Fallback system: NOT AVAILABLE" >> /workspaces/ai-sports-edge/logs/autosave.log
  FALLBACK_STATUS="unavailable"
fi

# Check cron service
if command -v crontab >/dev/null 2>&1; then
  echo "✅ Cron service: AVAILABLE" >> /workspaces/ai-sports-edge/logs/autosave.log
  CRON_STATUS="available"
else
  echo "❌ Cron service: NOT AVAILABLE" >> /workspaces/ai-sports-edge/logs/autosave.log
  CRON_STATUS="unavailable"
fi

# Create status file
STATUS_FILE="/workspaces/ai-sports-edge/logs/context-systems-status.json"
echo "{" > "$STATUS_FILE"
echo "  \"timestamp\": \"$(date)\"," >> "$STATUS_FILE"
echo "  \"primary_system\": \"$PRIMARY_STATUS\"," >> "$STATUS_FILE"
echo "  \"fallback_system\": \"$FALLBACK_STATUS\"," >> "$STATUS_FILE"
echo "  \"cron_service\": \"$CRON_STATUS\"," >> "$STATUS_FILE"
echo "  \"recommended_action\": \"$([ "$PRIMARY_STATUS" = "unavailable" ] && echo "rebuild-container" || echo "none")\"" >> "$STATUS_FILE"
echo "}" >> "$STATUS_FILE"

echo "✅ System verification completed" >> /workspaces/ai-sports-edge/logs/autosave.log

# If primary system is unavailable but fallback is available, run fallback
if [ "$PRIMARY_STATUS" = "unavailable" ] && [ "$FALLBACK_STATUS" = "available" ]; then
  echo "🔄 Primary system unavailable, running fallback..." >> /workspaces/ai-sports-edge/logs/autosave.log
  /workspaces/ai-sports-edge/scripts/fallback-context-save.sh
fi