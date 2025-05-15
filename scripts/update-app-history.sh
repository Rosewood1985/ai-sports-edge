#!/bin/bash
# scripts/update-app-history.sh
# Extracts historical implementation data and logs to app-history.md

OUTPUT_FILE="memory-bank/app-history.md"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Ensure output file exists
mkdir -p memory-bank
touch "$OUTPUT_FILE"

echo "🔁 [Backfill] Scanning project files for feature history..."

# Search for comments across relevant files
grep -Erni \
  --include=\*.{ts,tsx,js,json,md,sh} \
  --exclude-dir={node_modules,.git,build,dist} \
  'ROO-|TODO|NOTE|Implemented|Feature|Milestone' \
  . | while read -r line; do

  FILE_PATH=$(echo "$line" | cut -d: -f1)
  LINE_NUM=$(echo "$line" | cut -d: -f2)
  COMMENT=$(echo "$line" | cut -d: -f3- | sed 's/^ *//')

  echo "## [${TIMESTAMP}]" >> "$OUTPUT_FILE"
  echo "- Implemented: $COMMENT" >> "$OUTPUT_FILE"
  echo "- Source: $FILE_PATH:$LINE_NUM" >> "$OUTPUT_FILE"
  echo "- Status: pending merge" >> "$OUTPUT_FILE"
  echo "- Notes: Auto-extracted from code comment" >> "$OUTPUT_FILE"
  echo -e "\n---\n" >> "$OUTPUT_FILE"
done

echo "✅ App history updated in $OUTPUT_FILE"