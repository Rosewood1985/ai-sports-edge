#!/bin/bash
# Monitor and protect documentation file structure

BASE_DIR="/Users/lisadario/Desktop/ai-sports-edge/docs-consolidated"
SNAPSHOT_DIR="/Users/lisadario/Desktop/ai-sports-edge/monitoring/file-snapshots"
REPORT_FILE="/Users/lisadario/Desktop/ai-sports-edge/logs/file-structure-report.md"

# Create snapshot directory if it doesn't exist
mkdir -p "$SNAPSHOT_DIR"

# Create current snapshot
CURRENT_SNAPSHOT="$SNAPSHOT_DIR/snapshot-$(date +%Y%m%d_%H%M%S).txt"
find "$BASE_DIR" -type f -name "*.md" | sort > "$CURRENT_SNAPSHOT"

# Compare with previous snapshot if exists
PREV_SNAPSHOT=$(ls -t "$SNAPSHOT_DIR"/snapshot-*.txt 2>/dev/null | sed -n '2p')

if [ -f "$PREV_SNAPSHOT" ]; then
    echo "# File Structure Change Report - $(date)" > "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    echo "## New Files:" >> "$REPORT_FILE"
    comm -13 "$PREV_SNAPSHOT" "$CURRENT_SNAPSHOT" >> "$REPORT_FILE"
    
    echo "" >> "$REPORT_FILE"
    echo "## Deleted Files:" >> "$REPORT_FILE"
    comm -23 "$PREV_SNAPSHOT" "$CURRENT_SNAPSHOT" >> "$REPORT_FILE"
    
    echo "" >> "$REPORT_FILE"
    echo "## Files in Unexpected Locations:" >> "$REPORT_FILE"
    # Check for files not in expected directories
    grep -v -E "(01-gpt-personas|02-architecture|03-implementation|04-features|05-business|06-deployment|07-ui-ux|08-workflows|99-archive|consolidated)" "$CURRENT_SNAPSHOT" >> "$REPORT_FILE"
fi

# Clean up old snapshots (keep last 30 days)
find "$SNAPSHOT_DIR" -name "snapshot-*.txt" -mtime +30 -delete

echo "File structure monitoring complete. Report saved to: $REPORT_FILE"