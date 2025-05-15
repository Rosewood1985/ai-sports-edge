#!/bin/bash
# Monthly GPT instructions review with file structure monitoring

LOG_FILE="/Users/lisadario/Desktop/ai-sports-edge/logs/gpt-review.log"
DATE=$(date '+%Y-%m-%d')

echo "Starting GPT monthly review - $DATE" >> "$LOG_FILE"

# Run file structure monitoring
/Users/lisadario/Desktop/ai-sports-edge/scripts/monitor-file-structure.sh

# Generate usage statistics
/Users/lisadario/Desktop/ai-sports-edge/scripts/track-gpt-usage.sh --stats

# Create review report
REVIEW_FILE="/Users/lisadario/Desktop/ai-sports-edge/docs-consolidated/01-gpt-personas/consolidated/review-$(date +%Y%m).md"
cp /Users/lisadario/Desktop/ai-sports-edge/docs-consolidated/01-gpt-personas/consolidated/review-checklist.md "$REVIEW_FILE"

# Append file structure report
echo "" >> "$REVIEW_FILE"
echo "## File Structure Changes" >> "$REVIEW_FILE"
cat /Users/lisadario/Desktop/ai-sports-edge/logs/file-structure-report.md >> "$REVIEW_FILE"

echo "GPT review completed. Review file: $REVIEW_FILE" >> "$LOG_FILE"