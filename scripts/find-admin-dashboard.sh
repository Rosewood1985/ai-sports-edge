#!/bin/bash
# find-admin-dashboard.sh - Locate existing admin dashboard components in the project

echo "🔍 Searching for admin dashboard files..."

# Create directory for search results
mkdir -p .roocode/search_results
RESULTS_FILE=".roocode/search_results/dashboard_files.md"

# Start fresh results file
echo "# Admin Dashboard Files Found" > $RESULTS_FILE
echo "Search conducted on $(date)" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# Search for dashboard-related files with high likelihood of being dashboard components
echo "## High Confidence Matches" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# Look for specific dashboard filenames and paths
find . -type f \( -path "*/admin*" -o -path "*/dashboard*" -o -name "*Admin*" -o -name "*Dashboard*" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/build/*" \
  -not -path "*/dist/*" \
  -not -path "*/.git/*" \
  | sort \
  | while read file; do
    echo "- **$file**" >> $RESULTS_FILE
    # Extract a preview of the file content (first 5 lines that aren't empty or imports)
    grep -v -e "^$" -e "^import" "$file" | head -n 5 | sed 's/^/  > /' >> $RESULTS_FILE
    echo "" >> $RESULTS_FILE
done

# Look for React components with dashboard-like content
echo "## Potential Dashboard Components" >> $RESULTS_FILE
echo "Files containing dashboard-related code:" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# Grep for dashboard-related terms in component files
grep -l -r --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" \
  -e "dashboard" -e "admin" -e "control panel" -e "metrics" -e "analytics" \
  --exclude-dir={node_modules,build,dist,.git} . \
  | sort \
  | while read file; do
    # Skip files already identified in high confidence matches
    if ! grep -q "$file" $RESULTS_FILE; then
      echo "- **$file**" >> $RESULTS_FILE
      # Count dashboard-related terms to assess relevance
      matches=$(grep -c -e "dashboard" -e "admin" -e "control panel" -e "metrics" -e "analytics" "$file")
      echo "  > Contains $matches dashboard-related references" >> $RESULTS_FILE
      echo "" >> $RESULTS_FILE
    fi
done

# Find CSS/SCSS files that might be styling the dashboard
echo "## Dashboard Styling Files" >> $RESULTS_FILE
echo "CSS/SCSS files likely styling dashboard components:" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

find . -type f \( -name "*.css" -o -name "*.scss" -o -name "*.less" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/build/*" \
  -not -path "*/dist/*" \
  -not -path "*/.git/*" \
  | xargs grep -l -e "dashboard" -e "admin" -e "control-panel" -e "metrics" -e "analytics" \
  | sort \
  | while read file; do
    echo "- **$file**" >> $RESULTS_FILE
    echo "" >> $RESULTS_FILE
done

# Find the most recently modified dashboard files
echo "## Recently Modified Dashboard Files" >> $RESULTS_FILE
echo "Dashboard files modified in the last 30 days:" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

find . -type f -mtime -30 \
  \( -path "*/admin*" -o -path "*/dashboard*" -o -name "*Admin*" -o -name "*Dashboard*" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/build/*" \
  -not -path "*/dist/*" \
  -not -path "*/.git/*" \
  | sort \
  | while read file; do
    mod_time=$(stat -c %y "$file" 2>/dev/null || stat -f "%Sm" "$file" 2>/dev/null)
    echo "- **$file** (Modified: $mod_time)" >> $RESULTS_FILE
    echo "" >> $RESULTS_FILE
done

# Count total results
total_files=$(grep -c "^- \*\*" $RESULTS_FILE)

echo "" >> $RESULTS_FILE
echo "Total dashboard-related files found: $total_files" >> $RESULTS_FILE

echo "✅ Search complete! Found $total_files dashboard-related files."
echo "📊 Results saved to $RESULTS_FILE"
echo ""
echo "Most likely dashboard locations:"
grep "^- \*\*.*\(admin\|dashboard\).*\.jsx\?" $RESULTS_FILE | head -n 5

# Create a command for Roo to execute
mkdir -p .roocode
cat > .roocode/dashboard_finder.js << EOF
// Dashboard finder for Roo
// Show dashboard search results
const fs = require('fs');
const path = require('path');

const resultsFile = path.join('.roocode', 'search_results', 'dashboard_files.md');

if (fs.existsSync(resultsFile)) {
  const results = fs.readFileSync(resultsFile, 'utf8');
  console.log(results);
  
  // Extract main dashboard component path
  const mainMatch = results.match(/\*\*(.*?(admin|dashboard).*?\.jsx?)\*\*/i);
  if (mainMatch && mainMatch[1]) {
    console.log('\nRecommended dashboard to examine first:');
    console.log(mainMatch[1]);
    
    // If file exists, show some content
    if (fs.existsSync(mainMatch[1].trim())) {
      const content = fs.readFileSync(mainMatch[1].trim(), 'utf8');
      console.log('\nPreview:');
      console.log(content.split('\n').slice(0, 20).join('\n'));
    }
  }
} else {
  console.log('No dashboard search results found. Run find-admin-dashboard.sh first.');
}
EOF

chmod +x .roocode/dashboard_finder.js

echo "To have Roo display the results, run:"
echo "node .roocode/dashboard_finder.js"

# Check for orphaned files
echo "Checking for orphaned files..."
ORPHANED_FILE_LIST=".roocode/orphaned_files.txt"

# Find files that appear to be in non-standard locations
find . -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" -o -name "*.css" -o -name "*.scss" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/build/*" \
  -not -path "*/dist/*" \
  -not -path "*/.git/*" \
  -not -path "*/src/components/*" \
  -not -path "*/src/pages/*" \
  -not -path "*/src/utils/*" \
  -not -path "*/src/services/*" \
  -not -path "*/src/assets/*" \
  -not -path "*/src/styles/*" \
  -not -path "*/scripts/*" \
  -not -path "*/docs/*" \
  > "$ORPHANED_FILE_LIST"

orphaned_count=$(wc -l < "$ORPHANED_FILE_LIST")

if [[ $orphaned_count -gt 0 ]]; then
  echo "Found $orphaned_count potentially orphaned files."
  
  # Source the auto-organize script if it exists
  if [[ -f "scripts/auto-organize.sh" ]]; then
    source scripts/auto-organize.sh
    cat "$ORPHANED_FILE_LIST" | roo_organize_orphaned_files
  else
    echo "To organize these files, run: scripts/auto-organize.sh"
  fi
fi