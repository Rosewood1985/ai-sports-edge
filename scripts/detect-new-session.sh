#!/bin/bash

# Creates a session marker and detects when a new session starts
# Usage: Run at the beginning of each command you send to Roo Code

SESSION_FILE="/workspaces/ai-sports-edge/.context/.session_marker"
LAST_SESSION=$(cat $SESSION_FILE 2>/dev/null || echo "0")
CURRENT_TIME=$(date +%s)

# If more than 3 minutes have passed, consider it a new session
if (( CURRENT_TIME - LAST_SESSION > 180 )); then
  echo "NEW ROO CODE SESSION DETECTED!"
  echo "Loading context..."
  /workspaces/ai-sports-edge/scripts/load-context.sh
fi

# Update the session marker
echo $CURRENT_TIME > $SESSION_FILE