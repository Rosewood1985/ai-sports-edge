#!/bin/bash
#
# archive-redundant-files.sh
#
# This script safely archives redundant files after migration or consolidation
# instead of deleting them, preserving the history of the codebase.
#
# Usage: ./scripts/archive-redundant-files.sh file1.ts file2.ts ...

ARCHIVE_DIR="/workspaces/ai-sports-edge/__archived"
DATE=$(date +"%Y%m%d")
LOG_FILE="$ARCHIVE_DIR/archive_log.md"

# Create archive directory if it doesn't exist
mkdir -p "$ARCHIVE_DIR"

# Create or append to log file
if [ ! -f "$LOG_FILE" ]; then
  echo "# Archived Files Log" > "$LOG_FILE"
  echo "" >> "$LOG_FILE"
  echo "| Date | File | Reason |" >> "$LOG_FILE"
  echo "|------|------|--------|" >> "$LOG_FILE"
fi

# Process each file
for file in "$@"; do
  if [[ -f "$file" ]]; then
    # Extract reason from file header if available
    REASON="Manual archiving"
    if grep -q "MIGRATED\|CONSOLIDATED" "$file"; then
      REASON=$(head -n 1 "$file" | sed 's/\/\/ //')
    fi
    
    # Create destination path with date prefix
    FILENAME=$(basename "$file")
    DEST_PATH="$ARCHIVE_DIR/${DATE}_${FILENAME}"
    
    echo "Archiving $file → $DEST_PATH"
    cp "$file" "$DEST_PATH"
    
    # Add entry to log file
    echo "| $DATE | $file | $REASON |" >> "$LOG_FILE"
    
    # Remove original file
    rm "$file"
    
    echo "✅ Archived: $file"
  else
    echo "⚠️ File not found: $file"
  fi
done

echo "Archive operation complete. Log updated at $LOG_FILE"