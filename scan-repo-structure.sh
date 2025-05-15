#!/bin/bash

# Output path
OUTPUT="./repo-structure-scan.txt"

# Clear previous
echo "🔍 Scanning project directory structure..." > "$OUTPUT"
echo "" >> "$OUTPUT"

# Directory tree summary
echo "📁 Directory Structure:" >> "$OUTPUT"
tree -a -I 'node_modules|.git' >> "$OUTPUT"

# File type summary
echo "" >> "$OUTPUT"
echo "📊 File Type Breakdown:" >> "$OUTPUT"
find . -type f | sed 's|.*\.||' | sort | uniq -c | sort -nr >> "$OUTPUT"

# Specific folders of interest
echo "" >> "$OUTPUT"
echo "📌 Tasks Folder Contents:" >> "$OUTPUT"
find ./tasks -type f 2>/dev/null >> "$OUTPUT"

echo "" >> "$OUTPUT"
echo "📌 Scripts Folder Contents:" >> "$OUTPUT"
find ./scripts -type f 2>/dev/null >> "$OUTPUT"

echo "" >> "$OUTPUT"
echo "✅ Scan complete. Output saved to $OUTPUT"