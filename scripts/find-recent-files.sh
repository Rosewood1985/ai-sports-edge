#!/bin/bash
#
# AI Sports Edge - Find Recently Created Files
# This script finds files created or modified within a specified time period.

# Exit on error
set -e

# Default values
DAYS=7
OUTPUT_FILE="status/recent-files-report.md"
EXCLUDE_PATTERNS=("node_modules" "build" "dist" "coverage" ".git" "*.log")

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -d|--days)
      DAYS="$2"
      shift 2
      ;;
    -o|--output)
      OUTPUT_FILE="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  -d, --days DAYS      Find files created/modified in the last DAYS days (default: 7)"
      echo "  -o, --output FILE    Output file for the report (default: status/recent-files-report.md)"
      echo "  -h, --help           Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Ensure output directory exists
mkdir -p "$(dirname "$OUTPUT_FILE")"

# Build exclude pattern for find command
EXCLUDE_ARGS=()
for pattern in "${EXCLUDE_PATTERNS[@]}"; do
  EXCLUDE_ARGS+=("-not" "-path" "*/$pattern/*")
done

# Find recently created/modified files
echo "Finding files created or modified in the last $DAYS days..."
RECENT_FILES=$(find . -type f -mtime -$DAYS "${EXCLUDE_ARGS[@]}" | sort)

# Count files by type
echo "Counting files by type..."
JS_FILES=$(echo "$RECENT_FILES" | grep -c "\.js$" || echo 0)
TS_FILES=$(echo "$RECENT_FILES" | grep -c "\.ts$" || echo 0)
TSX_FILES=$(echo "$RECENT_FILES" | grep -c "\.tsx$" || echo 0)
JSX_FILES=$(echo "$RECENT_FILES" | grep -c "\.jsx$" || echo 0)
MD_FILES=$(echo "$RECENT_FILES" | grep -c "\.md$" || echo 0)
JSON_FILES=$(echo "$RECENT_FILES" | grep -c "\.json$" || echo 0)
SH_FILES=$(echo "$RECENT_FILES" | grep -c "\.sh$" || echo 0)
OTHER_FILES=$(echo "$RECENT_FILES" | grep -v -E "\.(js|ts|tsx|jsx|md|json|sh)$" | wc -l || echo 0)

# Count files by directory
echo "Counting files by directory..."
SRC_FILES=$(echo "$RECENT_FILES" | grep -c "^./src/" || echo 0)
ATOMIC_FILES=$(echo "$RECENT_FILES" | grep -c "^./atomic/" || echo 0)
COMPONENTS_FILES=$(echo "$RECENT_FILES" | grep -c "^./components/" || echo 0)
SCRIPTS_FILES=$(echo "$RECENT_FILES" | grep -c "^./scripts/" || echo 0)
FUNCTIONS_FILES=$(echo "$RECENT_FILES" | grep -c "^./functions/" || echo 0)
DOCS_FILES=$(echo "$RECENT_FILES" | grep -c "^./docs/" || echo 0)
STATUS_FILES=$(echo "$RECENT_FILES" | grep -c "^./status/" || echo 0)
TASKS_FILES=$(echo "$RECENT_FILES" | grep -c "^./tasks/" || echo 0)

# Generate the report
echo "Generating report..."
cat > "$OUTPUT_FILE" << EOF
# AI Sports Edge Recent Files Report

*Generated on $(date '+%Y-%m-%d %H:%M:%S')*

This report shows files created or modified in the last $DAYS days.

## Summary

### Files by Type
- JavaScript (.js): $JS_FILES
- TypeScript (.ts): $TS_FILES
- TypeScript React (.tsx): $TSX_FILES
- JavaScript React (.jsx): $JSX_FILES
- Markdown (.md): $MD_FILES
- JSON (.json): $JSON_FILES
- Shell Scripts (.sh): $SH_FILES
- Other: $OTHER_FILES

### Files by Directory
- /src: $SRC_FILES
- /atomic: $ATOMIC_FILES
- /components: $COMPONENTS_FILES
- /scripts: $SCRIPTS_FILES
- /functions: $FUNCTIONS_FILES
- /docs: $DOCS_FILES
- /status: $STATUS_FILES
- /tasks: $TASKS_FILES

## Recently Created/Modified Files

EOF

# Add files to the report, grouped by directory
echo "Adding files to report..."

# Function to add files from a specific directory to the report
add_directory_files() {
  local dir=$1
  local title=$2
  local files=$(echo "$RECENT_FILES" | grep "^$dir" || echo "")
  
  if [ -n "$files" ]; then
    echo "### $title" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "$files" | while read -r file; do
      # Get file modification time
      local mod_time=$(stat -f "%Sm" "$file" 2>/dev/null || stat -c "%y" "$file" 2>/dev/null)
      echo "- \`$file\` (Modified: $mod_time)" >> "$OUTPUT_FILE"
    done
    echo "" >> "$OUTPUT_FILE"
  fi
}

# Add files by directory
add_directory_files "./src/" "Source Code (/src)"
add_directory_files "./atomic/" "Atomic Components (/atomic)"
add_directory_files "./components/" "Components (/components)"
add_directory_files "./scripts/" "Scripts (/scripts)"
add_directory_files "./functions/" "Firebase Functions (/functions)"
add_directory_files "./docs/" "Documentation (/docs)"
add_directory_files "./status/" "Status Reports (/status)"
add_directory_files "./tasks/" "Tasks (/tasks)"

# Add other files
OTHER_FILES=$(echo "$RECENT_FILES" | grep -v -E "^\./(src|atomic|components|scripts|functions|docs|status|tasks)/" || echo "")
if [ -n "$OTHER_FILES" ]; then
  echo "### Other Files" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
  echo "$OTHER_FILES" | while read -r file; do
    # Get file modification time
    local mod_time=$(stat -f "%Sm" "$file" 2>/dev/null || stat -c "%y" "$file" 2>/dev/null)
    echo "- \`$file\` (Modified: $mod_time)" >> "$OUTPUT_FILE"
  done
  echo "" >> "$OUTPUT_FILE"
fi

# Add recommendations
echo "### Recommendations" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "Based on recent file activity:" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

if [ "$ATOMIC_FILES" -gt 0 ]; then
  echo "- Continue developing the atomic architecture components" >> "$OUTPUT_FILE"
fi

if [ "$SCRIPTS_FILES" -gt 0 ]; then
  echo "- Ensure all scripts are properly documented and executable" >> "$OUTPUT_FILE"
fi

if [ "$FUNCTIONS_FILES" -gt 0 ]; then
  echo "- Test Firebase Functions locally before deployment" >> "$OUTPUT_FILE"
fi

if [ "$DOCS_FILES" -gt 0 ]; then
  echo "- Keep documentation up-to-date with code changes" >> "$OUTPUT_FILE"
fi

echo "- Run the implementation status report to track overall progress" >> "$OUTPUT_FILE"
echo "- Consider creating unit tests for new components" >> "$OUTPUT_FILE"

echo "Report generated at $OUTPUT_FILE"