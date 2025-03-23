#!/bin/bash

# Debug and Optimize Script
# This script runs all debugging and optimization scripts in sequence

# Exit on error
set -e

# Display script header
echo "=========================================="
echo "AI Sports Edge Debug and Optimize Script"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "app.json" ]; then
    echo "Error: app.json not found. Please run this script from the project root directory."
    exit 1
fi

# Check if all required scripts exist
if [ ! -f "scripts/ui-debug.sh" ] || [ ! -f "scripts/optimize-api-calls.sh" ] || [ ! -f "scripts/design-consistency-check.sh" ]; then
    echo "Error: One or more required scripts are missing."
    echo "Please ensure the following scripts exist:"
    echo "- scripts/ui-debug.sh"
    echo "- scripts/optimize-api-calls.sh"
    echo "- scripts/design-consistency-check.sh"
    exit 1
fi

# Check if scripts are executable
if [ ! -x "scripts/ui-debug.sh" ] || [ ! -x "scripts/optimize-api-calls.sh" ] || [ ! -x "scripts/design-consistency-check.sh" ]; then
    echo "Making scripts executable..."
    chmod +x scripts/ui-debug.sh
    chmod +x scripts/optimize-api-calls.sh
    chmod +x scripts/design-consistency-check.sh
fi

# Function to run a script and log results
run_script() {
    local script=$1
    local log_file=$2
    
    echo "Running $script..."
    echo "Results will be logged to $log_file"
    echo ""
    
    # Run the script and log output
    $script | tee $log_file
    
    echo ""
    echo "$script completed."
    echo "Results logged to $log_file"
    echo ""
}

# Create logs directory if it doesn't exist
mkdir -p logs

# Get current timestamp
timestamp=$(date +"%Y%m%d_%H%M%S")

# Run UI debugging script
run_script "./scripts/ui-debug.sh" "logs/ui-debug_$timestamp.log"

# Run API optimization script
run_script "./scripts/optimize-api-calls.sh" "logs/api-optimization_$timestamp.log"

# Run design consistency check script
run_script "./scripts/design-consistency-check.sh" "logs/design-consistency_$timestamp.log"

# Generate summary report
echo "Generating summary report..."
echo ""

# Create summary report
cat > "logs/summary_$timestamp.md" << EOF
# AI Sports Edge Debug and Optimize Summary

**Date:** $(date +"%Y-%m-%d %H:%M:%S")

## UI Debugging Results

\`\`\`
$(grep "Total issues found:" logs/ui-debug_$timestamp.log)
\`\`\`

### Top UI Issues:

\`\`\`
$(grep "⚠️" logs/ui-debug_$timestamp.log | head -5)
\`\`\`

## API Optimization Results

\`\`\`
$(grep "Total issues found:" logs/api-optimization_$timestamp.log)
\`\`\`

### Top API Issues:

\`\`\`
$(grep "⚠️" logs/api-optimization_$timestamp.log | head -5)
\`\`\`

## Design Consistency Results

\`\`\`
$(grep "Total issues found:" logs/design-consistency_$timestamp.log)
\`\`\`

### Top Design Issues:

\`\`\`
$(grep "⚠️" logs/design-consistency_$timestamp.log | head -5)
\`\`\`

## Next Steps

1. Address UI issues identified in \`logs/ui-debug_$timestamp.log\`
2. Optimize API calls as suggested in \`logs/api-optimization_$timestamp.log\`
3. Improve design consistency based on \`logs/design-consistency_$timestamp.log\`
4. Run this script again to verify improvements

## Manual Testing Checklist

- [ ] Test on multiple iOS devices (different screen sizes)
- [ ] Test on web browsers (Chrome, Safari, Firefox)
- [ ] Test with VoiceOver/screen readers
- [ ] Test in dark mode
- [ ] Test with Spanish language setting
- [ ] Test offline functionality
- [ ] Test live odds updates
- [ ] Test parlay suggestions
EOF

echo "Summary report generated: logs/summary_$timestamp.md"
echo ""

# Display final message
echo "=========================================="
echo "Debug and Optimize Process Completed!"
echo "=========================================="
echo ""
echo "All results have been logged to the logs directory."
echo "Summary report: logs/summary_$timestamp.md"
echo ""
echo "Next steps:"
echo "1. Review the summary report"
echo "2. Address the identified issues"
echo "3. Run this script again to verify improvements"
echo "4. Perform manual testing using the checklist in the summary report"
echo ""
echo "For manual testing, run:"
echo "- Web: npm run start:web"
echo "- iOS: npx expo start --ios"