#!/bin/bash

DOWNLOADS=~/Downloads
DEST=~/Desktop/ai-sports-edge
LOG="$DEST/sync-log.txt"
SUMMARY="$DEST/md-update-summary.md"

echo "🔄 Syncing updated .md files from Downloads to AI Sports Edge..." | tee -a "$LOG"

# Ensure log and summary files exist
touch "$LOG"
touch "$SUMMARY"

# Process .md files in Downloads
for file in "$DOWNLOADS"/*.md; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    destination="$DEST/$filename"
    
    # Move file
    mv "$file" "$destination"
    echo "📝 $filename synced on $(date)" >> "$LOG"
    echo "✅ Moved: $filename" | tee -a "$LOG"
    
    # Add content summary to md-update-summary.md
    echo -e "
### $filename — Synced on $(date)
" >> "$SUMMARY"
    head -n 10 "$destination" >> "$SUMMARY"
    echo -e "
---
" >> "$SUMMARY"
  fi
done

echo "✅ All .md files synced to $DEST" | tee -a "$LOG"
echo "📝 Reminder: Run pulse-check.command to verify updates."
