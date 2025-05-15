#!/bin/bash

# find-consolidation-candidates.sh
# A script to find potential file consolidation candidates based on search patterns
# Usage: find-consolidation-candidates.sh <category> <search_pattern>
#
# Example: find-consolidation-candidates.sh onboarding "tutorial\|intro\|first-time"

# Check if required arguments are provided
if [ $# -lt 2 ]; then
  echo "Usage: find-consolidation-candidates.sh <category> <search_pattern>"
  echo "Example: find-consolidation-candidates.sh onboarding \"tutorial\|intro\|first-time\""
  exit 1
fi

CATEGORY=$1
SEARCH_PATTERN=$2
OUTPUT_DIR="/workspaces/ai-sports-edge/.context/consolidation-candidates"
OUTPUT_FILE="$OUTPUT_DIR/$CATEGORY.txt"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

echo "Finding consolidation candidates for category: $CATEGORY"
echo "Using search pattern: $SEARCH_PATTERN"
echo "Results will be saved to: $OUTPUT_FILE"

# Clear previous results
> "$OUTPUT_FILE"

# Search for files matching the pattern
echo "# Consolidation Candidates - $CATEGORY" > "$OUTPUT_FILE"
echo "# Search pattern: $SEARCH_PATTERN" >> "$OUTPUT_FILE"
echo "# Generated on: $(date)" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Find files containing the search pattern
echo "## Files containing the pattern:" >> "$OUTPUT_FILE"
grep -r --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" "$SEARCH_PATTERN" /workspaces/ai-sports-edge/components/ /workspaces/ai-sports-edge/screens/ /workspaces/ai-sports-edge/services/ 2>/dev/null | sort | while read -r line; do
  file_path=$(echo "$line" | cut -d':' -f1)
  echo "- $file_path" >> "$OUTPUT_FILE"
done

# Find files with similar names
echo "" >> "$OUTPUT_FILE"
echo "## Files with similar names:" >> "$OUTPUT_FILE"
find /workspaces/ai-sports-edge -type f -name "*$CATEGORY*" | sort | while read -r file; do
  echo "- $file" >> "$OUTPUT_FILE"
done

# Add some analysis
echo "" >> "$OUTPUT_FILE"
echo "## Preliminary Analysis" >> "$OUTPUT_FILE"
echo "These files may be candidates for consolidation based on the search pattern and naming conventions." >> "$OUTPUT_FILE"
echo "Please review each file to determine if they serve similar purposes and can be consolidated." >> "$OUTPUT_FILE"

echo "Consolidation candidates search complete. Results saved to $OUTPUT_FILE"