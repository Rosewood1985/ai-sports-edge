#!/bin/bash
#
# AI Sports Edge - Generate Weekly Status Report
# This script generates a comprehensive weekly status report for the project.

# Add logging
echo "$(date): Running $(basename $0)" >> .roocode/tool_usage.log

# Exit on error
set -e

# Configuration
REPORT_DIR="status/weekly-reports"
REPORT_FILE="$REPORT_DIR/weekly-report-$(date +%Y-%m-%d).md"
TEMP_DIR="temp-status"
LOG_DIR=".roocode/logs"

# Ensure directories exist
mkdir -p "$REPORT_DIR"
mkdir -p "$TEMP_DIR"
mkdir -p "$LOG_DIR"
mkdir -p ".roocode"

# Get the date range for this week
WEEK_START=$(date -d "last Sunday" +"%Y-%m-%d" 2>/dev/null || date -v-Sunday +"%Y-%m-%d" 2>/dev/null || echo "Unknown")
WEEK_END=$(date -d "next Saturday" +"%Y-%m-%d" 2>/dev/null || date -v+Saturday +"%Y-%m-%d" 2>/dev/null || echo "Unknown")

echo "Generating weekly status report for $WEEK_START to $WEEK_END..."

# Start the report
cat > "$REPORT_FILE" << EOF
# AI Sports Edge Weekly Status Report

**Week of $WEEK_START to $WEEK_END**

Generated on $(date)

## 1. Project Overview

EOF

# Get implementation status
echo "Checking implementation status..."
if [ -f "scripts/generate-implementation-status.js" ]; then
  node scripts/generate-implementation-status.js > "$TEMP_DIR/implementation-status.md"
  
  # Extract summary from implementation status
  TOTAL_TASKS=$(grep -o "Total Tasks: [0-9]*" "$TEMP_DIR/implementation-status.md" | awk '{print $3}')
  IMPLEMENTED_TASKS=$(grep -o "Implemented: [0-9]*" "$TEMP_DIR/implementation-status.md" | awk '{print $2}' | head -1)
  REMAINING_TASKS=$(grep -o "Remaining: [0-9]*" "$TEMP_DIR/implementation-status.md" | awk '{print $2}')
  
  # Add implementation summary to report
  cat >> "$REPORT_FILE" << EOF
### Implementation Progress

- **Total Tasks**: $TOTAL_TASKS
- **Implemented**: $IMPLEMENTED_TASKS
- **Remaining**: $REMAINING_TASKS

[Full Implementation Status Report](../current-status.md)

EOF
else
  echo "Implementation status script not found, skipping this section."
  cat >> "$REPORT_FILE" << EOF
### Implementation Progress

Implementation status report not available.

EOF
fi

# Get Firebase migration status
echo "Checking Firebase migration status..."
if [ -f "scripts/firebase-migration-tracker.sh" ]; then
  ./scripts/firebase-migration-tracker.sh status > "$TEMP_DIR/firebase-status.txt"
  
  # Extract phase information
  cat >> "$REPORT_FILE" << EOF
### Firebase Migration Progress

EOF
  
  grep "Phases:" -A 10 "$TEMP_DIR/firebase-status.txt" | grep -v "Phases:" >> "$REPORT_FILE"
  
  # Extract file counts
  cat >> "$REPORT_FILE" << EOF

#### Files

EOF
  
  grep "Files:" -A 5 "$TEMP_DIR/firebase-status.txt" | grep -v "Files:" >> "$REPORT_FILE"
else
  echo "Firebase migration tracker not found, skipping this section."
  cat >> "$REPORT_FILE" << EOF
### Firebase Migration Progress

Firebase migration status not available.

EOF
fi

# Find recently modified files
echo "Finding recently modified files..."
cat >> "$REPORT_FILE" << EOF

## 2. Recent Activity

### Files Modified This Week

EOF

# Find files modified in the last 7 days
find . -type f -mtime -7 \
  -not -path "*/node_modules/*" \
  -not -path "*/build/*" \
  -not -path "*/dist/*" \
  -not -path "*/.git/*" \
  -not -path "*/coverage/*" \
  -not -path "*/$TEMP_DIR/*" \
  -not -path "*/$LOG_DIR/*" \
  | sort \
  | while read file; do
    mod_time=$(stat -c %y "$file" 2>/dev/null || stat -f "%Sm" "$file" 2>/dev/null)
    echo "- **$file** (Modified: $mod_time)" >> "$REPORT_FILE"
done

# Count files by type
JS_FILES=$(find . -type f -mtime -7 -name "*.js" -not -path "*/node_modules/*" -not -path "*/build/*" -not -path "*/dist/*" -not -path "*/.git/*" | wc -l)
TS_FILES=$(find . -type f -mtime -7 -name "*.ts" -not -path "*/node_modules/*" -not -path "*/build/*" -not -path "*/dist/*" -not -path "*/.git/*" | wc -l)
TSX_FILES=$(find . -type f -mtime -7 -name "*.tsx" -not -path "*/node_modules/*" -not -path "*/build/*" -not -path "*/dist/*" -not -path "*/.git/*" | wc -l)
MD_FILES=$(find . -type f -mtime -7 -name "*.md" -not -path "*/node_modules/*" -not -path "*/build/*" -not -path "*/dist/*" -not -path "*/.git/*" | wc -l)
SH_FILES=$(find . -type f -mtime -7 -name "*.sh" -not -path "*/node_modules/*" -not -path "*/build/*" -not -path "*/dist/*" -not -path "*/.git/*" | wc -l)

cat >> "$REPORT_FILE" << EOF

### Files by Type

- JavaScript (.js): $JS_FILES
- TypeScript (.ts): $TS_FILES
- TypeScript React (.tsx): $TSX_FILES
- Markdown (.md): $MD_FILES
- Shell Scripts (.sh): $SH_FILES

EOF

# Get git commit history
echo "Getting git commit history..."
cat >> "$REPORT_FILE" << EOF

### Recent Commits

EOF

if command -v git &> /dev/null && [ -d ".git" ]; then
  git log --since="1 week ago" --pretty=format:"- **%h** (%ad) - %s" --date=short >> "$REPORT_FILE"
else
  echo "Git not available or not a git repository, skipping commit history."
  echo "Git commit history not available." >> "$REPORT_FILE"
fi

# Add deployment status
cat >> "$REPORT_FILE" << EOF

## 3. Deployment Status

EOF

if [ -f ".firebase/hosting.ZGlzdA.cache" ]; then
  LAST_DEPLOY=$(stat -c %y ".firebase/hosting.ZGlzdA.cache" 2>/dev/null || stat -f "%Sm" ".firebase/hosting.ZGlzdA.cache" 2>/dev/null)
  cat >> "$REPORT_FILE" << EOF
- **Firebase Hosting**: Last deployed on $LAST_DEPLOY
- **Custom Domain**: [aisportsedge.app](https://aisportsedge.app)
EOF
else
  echo "Firebase deployment information not found."
  cat >> "$REPORT_FILE" << EOF
Firebase deployment information not available.
EOF
fi

# Add next steps and recommendations
cat >> "$REPORT_FILE" << EOF

## 4. Next Steps and Recommendations

Based on the current project status:

EOF

# Add recommendations based on implementation status
if [ -n "$REMAINING_TASKS" ] && [ "$REMAINING_TASKS" -gt 0 ]; then
  cat >> "$REPORT_FILE" << EOF
- Continue implementing the remaining $REMAINING_TASKS tasks
EOF
fi

# Add recommendations based on Firebase migration status
if [ -f "scripts/firebase-migration-tracker.sh" ]; then
  ACTIVE_PHASE=$(grep "Active Phase:" "$TEMP_DIR/firebase-status.txt" | awk '{print $3}')
  if [ -n "$ACTIVE_PHASE" ]; then
    cat >> "$REPORT_FILE" << EOF
- Continue migration of files in the **$ACTIVE_PHASE** phase
EOF
  fi
fi

# Add general recommendations
cat >> "$REPORT_FILE" << EOF
- Run tests for all recently modified files
- Update documentation for new features
- Consider deploying to a preview channel for testing before production deployment
- Review and address any performance issues identified in the implementation status report

## 5. Issues and Blockers

*No issues or blockers identified. Please update this section manually if there are any.*

---

Report generated by \`generate-weekly-status.sh\`
EOF

# Clean up temporary files
rm -rf "$TEMP_DIR"

echo "Weekly status report generated: $REPORT_FILE"
echo "Opening report..."
if command -v code &> /dev/null; then
  code "$REPORT_FILE"
else
  echo "VS Code not available in PATH. Please open the report manually."
fi