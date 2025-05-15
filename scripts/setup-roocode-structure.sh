#!/bin/bash
# Setup script for .roocode directory structure
# This script creates the necessary directory structure for the Roocode utility suite.

set -e  # Exit on error

echo "🔧 Setting up .roocode directory structure"
echo "=========================================="
echo ""

# Create main .roocode directory
if [ -d ".roocode" ]; then
  echo "✅ .roocode directory already exists"
else
  mkdir -p .roocode
  echo "✅ Created .roocode directory"
fi

# Create checkpoints directory
if [ -d ".roocode/checkpoints" ]; then
  echo "✅ .roocode/checkpoints directory already exists"
else
  mkdir -p .roocode/checkpoints
  echo "✅ Created .roocode/checkpoints directory"
fi

# Create completed checkpoints directory
if [ -d ".roocode/checkpoints/completed" ]; then
  echo "✅ .roocode/checkpoints/completed directory already exists"
else
  mkdir -p .roocode/checkpoints/completed
  echo "✅ Created .roocode/checkpoints/completed directory"
fi

# Create corrupted checkpoints directory
if [ -d ".roocode/checkpoints/corrupted" ]; then
  echo "✅ .roocode/checkpoints/corrupted directory already exists"
else
  mkdir -p .roocode/checkpoints/corrupted
  echo "✅ Created .roocode/checkpoints/corrupted directory"
fi

# Create logs directory
if [ -d ".roocode/logs" ]; then
  echo "✅ .roocode/logs directory already exists"
else
  mkdir -p .roocode/logs
  echo "✅ Created .roocode/logs directory"
fi

# Create reports directory
if [ -d "reports" ]; then
  echo "✅ reports directory already exists"
else
  mkdir -p reports
  echo "✅ Created reports directory"
fi

# Create reports subdirectories
for dir in "duplicates" "history" "complete-analysis"; do
  if [ -d "reports/$dir" ]; then
    echo "✅ reports/$dir directory already exists"
  else
    mkdir -p "reports/$dir"
    echo "✅ Created reports/$dir directory"
  fi
done

# Create tool_usage.log if it doesn't exist
if [ -f ".roocode/tool_usage.log" ]; then
  echo "✅ .roocode/tool_usage.log already exists"
else
  touch .roocode/tool_usage.log
  echo "✅ Created .roocode/tool_usage.log"
fi

# Create .gitignore entries if needed
if [ -f ".gitignore" ]; then
  if grep -q ".roocode/checkpoints/" .gitignore; then
    echo "✅ .gitignore already contains .roocode/checkpoints/"
  else
    echo "" >> .gitignore
    echo "# Roocode utility suite" >> .gitignore
    echo ".roocode/checkpoints/" >> .gitignore
    echo ".roocode/logs/" >> .gitignore
    echo "reports/duplicates/" >> .gitignore
    echo "reports/history/" >> .gitignore
    echo "reports/complete-analysis/" >> .gitignore
    echo "✅ Added .roocode entries to .gitignore"
  fi
else
  echo "# Roocode utility suite" > .gitignore
  echo ".roocode/checkpoints/" >> .gitignore
  echo ".roocode/logs/" >> .gitignore
  echo "reports/duplicates/" >> .gitignore
  echo "reports/history/" >> .gitignore
  echo "reports/complete-analysis/" >> .gitignore
  echo "✅ Created .gitignore with .roocode entries"
fi

echo ""
echo "✅ .roocode directory structure setup complete!"
echo ""
echo "The following directories have been created:"
echo "  .roocode/"
echo "  ├── checkpoints/"
echo "  │   ├── completed/"
echo "  │   └── corrupted/"
echo "  └── logs/"
echo "  reports/"
echo "  ├── duplicates/"
echo "  ├── history/"
echo "  └── complete-analysis/"
echo ""
echo "The following files have been created or updated:"
echo "  .roocode/tool_usage.log"
echo "  .gitignore"
echo ""
echo "You can now use the following commands:"
echo "  ./scripts/roo-duplicates.js find"
echo "  ./scripts/roo-history-analyze.js analyze"
echo "  ./scripts/roo-complete-analysis.js analyze"
echo ""
echo "For more information, see the documentation:"
echo "  docs/progress-backfilling-system.md"
echo "  docs/historical-code-analysis-system.md"
echo "  docs/complete-analysis-system.md"