#!/bin/bash
#
# retro-tag-migrated.sh
#
# This script retroactively tags all previously migrated files that don't have
# the standardized migration header yet. It identifies migrated files by searching
# for references to firebaseService in the codebase.
#
# Usage: ./scripts/retro-tag-migrated.sh [optional: directory]

# Default to src directory if no argument provided
SEARCH_DIR="${1:-src/}"
LOG_FILE="memory-bank/retro-tagging-log.md"
HEADER="// ✅ MIGRATED: Firebase Atomic Architecture"
COUNT=0

echo "Running retroactive tagging for migrated files..."
echo "Searching in: $SEARCH_DIR"

# Create or update log file
if [ ! -f "$LOG_FILE" ]; then
  echo "# Retroactive Tagging Log" > "$LOG_FILE"
  echo "" >> "$LOG_FILE"
  echo "| Date | File | Status |" >> "$LOG_FILE"
  echo "|------|------|--------|" >> "$LOG_FILE"
fi

# Get current date
DATE=$(date +"%Y-%m-%d")

# Find files that import firebaseService but don't have the migration header
grep -r --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  "import.*firebaseService" "$SEARCH_DIR" | cut -d':' -f1 | while read file; do
  
  # Skip if file doesn't exist (might be a false positive)
  if [ ! -f "$file" ]; then
    continue
  fi
  
  # Check if file already has a migration header
  if grep -q "✅ MIGRATED\|🧩 CONSOLIDATED" "$file"; then
    echo "⏭️ Already tagged: $file"
    echo "| $DATE | $file | Already tagged |" >> "$LOG_FILE"
  else
    echo "🔖 Tagging: $file"
    sed -i "1i$HEADER" "$file"
    echo "| $DATE | $file | Tagged |" >> "$LOG_FILE"
    COUNT=$((COUNT + 1))
  fi
done

# Also check for files that use firebaseService but might not import it directly
grep -r --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  "firebaseService\." "$SEARCH_DIR" | cut -d':' -f1 | sort | uniq | while read file; do
  
  # Skip if file doesn't exist or was already processed
  if [ ! -f "$file" ] || grep -q "import.*firebaseService" "$file"; then
    continue
  fi
  
  # Check if file already has a migration header
  if grep -q "✅ MIGRATED\|🧩 CONSOLIDATED" "$file"; then
    echo "⏭️ Already tagged: $file"
    echo "| $DATE | $file | Already tagged |" >> "$LOG_FILE"
  else
    echo "🔖 Tagging: $file (uses firebaseService)"
    sed -i "1i$HEADER" "$file"
    echo "| $DATE | $file | Tagged (uses firebaseService) |" >> "$LOG_FILE"
    COUNT=$((COUNT + 1))
  fi
done

echo "✅ Retroactive tagging complete. Tagged $COUNT files."
echo "Log available at: $LOG_FILE"