#!/bin/bash
LOGFILE=~/automation-logs/clean-docs.log
exec >> "$LOGFILE" 2>&1
echo "=== $(date) === Running clean-docs-folder ==="

ROOT=~/Desktop/ai-sports-edge

echo ""
echo "🔍 Checking for duplicate markdown files by filename..."
find "$ROOT" -type f -name "*.md" | sed 's/.*\///' | sort | uniq -d

echo ""
echo "🧼 Scanning for .command files outside /automation/..."
find "$ROOT" -name "*.command" -not -path "$ROOT/automation/*"

echo ""
echo "📁 Listing large misc files (PDFs, JPGs, PNGs) not in /reference/..."
find "$ROOT" -type f \( -name "*.pdf" -o -name "*.jpg" -o -name "*.png" \) -not -path "$ROOT/reference/*"

echo ""
echo "🛑 Warning: Multiple README or GUIDE markdowns outside /docs/"
find "$ROOT" -type f -name "*README*.md" -not -path "$ROOT/docs/*"
find "$ROOT" -type f -name "*GUIDE*.md" -not -path "$ROOT/docs/*"

echo ""
echo "✅ clean-docs-folder complete"
