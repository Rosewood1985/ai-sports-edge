#!/bin/bash
#
# tag-headers.sh
# 
# This script adds standardized headers to migrated or consolidated files
# for the Firebase atomic architecture migration.
#
# Usage: ./scripts/tag-headers.sh migrated|consolidated path/to/file [optional: consolidated-from-list]

MODE="$1"
FILE="$2"
MERGED_FROM="$3"
DATE=$(date +"%Y-%m-%d")

if [ "$MODE" == "migrated" ]; then
  HEADER="// ✅ MIGRATED: Firebase Atomic Architecture"
elif [ "$MODE" == "consolidated" ]; then
  HEADER="// 🧩 CONSOLIDATED: Merged from [$MERGED_FROM] on $DATE"
else
  echo "Invalid mode. Use 'migrated' or 'consolidated'"
  exit 1
fi

if grep -q "✅ MIGRATED\|🧩 CONSOLIDATED" "$FILE"; then
  echo "Header already exists in $FILE"
else
  echo "Tagging $FILE with header: $HEADER"
  sed -i "1i$HEADER" "$FILE"
fi