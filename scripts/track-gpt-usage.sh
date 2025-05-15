#!/bin/bash
# Track GPT instruction usage and generate statistics

LOGS_DIR="/Users/lisadario/Desktop/ai-sports-edge/logs"
INSTRUCTIONS_DIR="/Users/lisadario/Desktop/ai-sports-edge/docs-consolidated/01-gpt-personas/consolidated"
STATS_FILE="${LOGS_DIR}/gpt-usage-stats.md"
USAGE_LOG="${LOGS_DIR}/gpt-usage.log"

# Create logs directory if it doesn't exist
mkdir -p "$LOGS_DIR"

# Function to log usage
log_usage() {
    local instruction_file="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "${timestamp} - ${instruction_file}" >> "$USAGE_LOG"
    echo "Usage logged: ${instruction_file}"
}

# Function to generate statistics
generate_stats() {
    echo "# GPT Instruction Usage Statistics" > "$STATS_FILE"
    echo "" >> "$STATS_FILE"
    echo "**Generated:** $(date '+%B %d, %Y')" >> "$STATS_FILE"
    echo "**Period:** Last 30 days" >> "$STATS_FILE"
    echo "" >> "$STATS_FILE"
    
    echo "## Most Used Instructions" >> "$STATS_FILE"
    echo "" >> "$STATS_FILE"
    echo "| Instruction File | Usage Count |" >> "$STATS_FILE"
    echo "|-----------------|-------------|" >> "$STATS_FILE"
    
    # Get usage counts for the last 30 days
    grep -E "^[0-9]{4}-[0-9]{2}-[0-9]{2}" "$USAGE_LOG" | 
        awk -v date=$(date -v-30d '+%Y-%m-%d') '$1 >= date {print $3}' | 
        sort | uniq -c | sort -nr | head -10 | 
        while read count file; do
            echo "| ${file} | ${count} |" >> "$STATS_FILE"
        done
    
    echo "" >> "$STATS_FILE"
    echo "## Unused Instructions" >> "$STATS_FILE"
    echo "" >> "$STATS_FILE"
    echo "The following instruction files have not been used in the last 30 days:" >> "$STATS_FILE"
    echo "" >> "$STATS_FILE"
    
    # Find unused files
    find "$INSTRUCTIONS_DIR" -type f -name "*.md" | while read file; do
        filename=$(basename "$file")
        if ! grep -q "$filename" "$USAGE_LOG"; then
            echo "- ${filename}" >> "$STATS_FILE"
        fi
    done
    
    echo "" >> "$STATS_FILE"
    echo "## Usage Trends" >> "$STATS_FILE"
    echo "" >> "$STATS_FILE"
    echo "| Date | Total Usage |" >> "$STATS_FILE"
    echo "|------|-------------|" >> "$STATS_FILE"
    
    # Get daily usage counts for the last 14 days
    for i in {13..0}; do
        date=$(date -v-${i}d '+%Y-%m-%d')
        count=$(grep "$date" "$USAGE_LOG" | wc -l | tr -d ' ')
        echo "| ${date} | ${count} |" >> "$STATS_FILE"
    done
    
    echo "" >> "$STATS_FILE"
    echo "## Recommendations" >> "$STATS_FILE"
    echo "" >> "$STATS_FILE"
    echo "Based on usage patterns, consider:" >> "$STATS_FILE"
    echo "" >> "$STATS_FILE"
    echo "1. Updating frequently used instructions to ensure they remain current" >> "$STATS_FILE"
    echo "2. Reviewing unused instructions to determine if they should be archived" >> "$STATS_FILE"
    echo "3. Consolidating similar instructions to reduce duplication" >> "$STATS_FILE"
    
    echo "Statistics generated at $STATS_FILE"
}

# Main execution
if [ "$1" == "--log" ] && [ -n "$2" ]; then
    log_usage "$2"
elif [ "$1" == "--stats" ]; then
    generate_stats
else
    echo "Usage:"
    echo "  $0 --log <instruction_file>  # Log usage of an instruction file"
    echo "  $0 --stats                   # Generate usage statistics"
    exit 1
fi

exit 0