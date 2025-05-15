#!/bin/bash

TODAY=$(date -v-1d +"%Y-%m-%d")
SOURCE_FILE="$HOME/Desktop/ai-sports-edge/${TODAY}-kickoff.md"
DEST_DIR="$HOME/Desktop/ai-sports-edge/kickoffs"

if [ -f "$SOURCE_FILE" ]; then
  mv "$SOURCE_FILE" "$DEST_DIR/${TODAY}-kickoff.md"
  echo "✅ Moved kickoff to $DEST_DIR/${TODAY}-kickoff.md"
else
  echo "⚠️ No kickoff file found for $TODAY in root directory"
fi
