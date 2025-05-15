#!/bin/bash

# Fallback Context Save Script
# This script provides a pure bash alternative to the Node.js-based context saving system
# It performs basic timestamp updates to memory bank files to ensure they're kept current

# Create logs directory if it doesn't exist
mkdir -p /workspaces/ai-sports-edge/logs

# Log start
echo "🔄 Fallback context save at $(date)" >> /workspaces/ai-sports-edge/logs/autosave.log

# Add notification when fallback system is used
NOTIFICATION_FILE="/workspaces/ai-sports-edge/logs/fallback-notification.log"
echo "⚠️ FALLBACK SYSTEM ACTIVATED at $(date)" > "$NOTIFICATION_FILE"
echo "The primary Node.js-based context saving system is not available." >> "$NOTIFICATION_FILE"
echo "Using fallback system to preserve context." >> "$NOTIFICATION_FILE"
echo "To resolve this issue, rebuild the container or install Node.js." >> "$NOTIFICATION_FILE"

# Track fallback system usage
USAGE_FILE="/workspaces/ai-sports-edge/logs/fallback-usage.json"
if [ -f "$USAGE_FILE" ]; then
  # File exists, increment counter
  CURRENT_COUNT=$(grep -o '"count": *[0-9]*' "$USAGE_FILE" | sed 's/"count": *//' | tr -d ' ')
  NEW_COUNT=$((CURRENT_COUNT + 1))
  sed -i "s/\"count\": *[0-9]*/\"count\": $NEW_COUNT/" "$USAGE_FILE"
  sed -i "s/\"last_used\": *\"[^\"]*\"/\"last_used\": \"$(date)\"/" "$USAGE_FILE"
else
  # Create new file
  echo "{" > "$USAGE_FILE"
  echo "  \"count\": 1," >> "$USAGE_FILE"
  echo "  \"first_used\": \"$(date)\"," >> "$USAGE_FILE"
  echo "  \"last_used\": \"$(date)\"" >> "$USAGE_FILE"
  echo "}" >> "$USAGE_FILE"
fi

# Create timestamp
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

# Ensure memory-bank directory exists
mkdir -p /workspaces/ai-sports-edge/memory-bank

# Update timestamp in memory bank files
for file in /workspaces/ai-sports-edge/memory-bank/*.md; do
  if [ -f "$file" ]; then
    # Create backup
    cp "$file" "${file}.bak"
    
    # Update timestamp line or add it if it doesn't exist
    if grep -q "Last updated:" "$file"; then
      sed -i "s/Last updated:.*$/Last updated: $TIMESTAMP/" "$file"
    else
      echo -e "\nLast updated: $TIMESTAMP" >> "$file"
    fi
    
    echo "Updated timestamp in $file" >> /workspaces/ai-sports-edge/logs/autosave.log
  fi
done

# Create or update .last-update file
echo "$TIMESTAMP" > /workspaces/ai-sports-edge/memory-bank/.last-update
echo "Created .last-update file" >> /workspaces/ai-sports-edge/logs/autosave.log

# Basic migration status update (simplified version of the Node.js functionality)
if [ -f /workspaces/ai-sports-edge/memory-bank/.migration-status.json ]; then
  # Make a backup of the current status file
  cp /workspaces/ai-sports-edge/memory-bank/.migration-status.json /workspaces/ai-sports-edge/memory-bank/.migration-status.json.bak
  
  # Update the lastUpdate field in the JSON file
  # This is a simple sed replacement that works for basic JSON structures
  sed -i "s/\"lastUpdate\": [0-9]*/\"lastUpdate\": $(date +%s)000/" /workspaces/ai-sports-edge/memory-bank/.migration-status.json
  
  echo "Updated migration status timestamp" >> /workspaces/ai-sports-edge/logs/autosave.log
else
  # Create a minimal migration status file if it doesn't exist
  echo "{\"lastUpdate\": $(date +%s)000, \"migratedFiles\": [], \"pendingFiles\": [], \"lastCheckpoint\": null}" > /workspaces/ai-sports-edge/memory-bank/.migration-status.json
  
  echo "Created new migration status file" >> /workspaces/ai-sports-edge/logs/autosave.log
fi

echo "✅ Fallback context save completed" >> /workspaces/ai-sports-edge/logs/autosave.log