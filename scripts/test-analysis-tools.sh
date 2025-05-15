#!/bin/bash
# Test script for analysis tools
# This script tests the Progress Backfilling System, Historical Code Analysis System,
# and Complete Analysis System to verify they work correctly.

set -e  # Exit on error

# Create necessary directories
mkdir -p .roocode/checkpoints/completed
mkdir -p .roocode/checkpoints/corrupted
mkdir -p .roocode/logs
mkdir -p reports/test-analysis

echo "🧪 Testing Analysis Tools"
echo "========================="
echo ""

# Test Progress Backfilling System
echo "📋 Testing Progress Backfilling System..."
echo ""

if [ -f "./scripts/roo-duplicates.js" ]; then
  echo "✅ roo-duplicates.js exists"
  
  # Test help command
  if node ./scripts/roo-duplicates.js --help | grep -q "find"; then
    echo "✅ roo-duplicates.js help command works"
  else
    echo "❌ roo-duplicates.js help command failed"
    exit 1
  fi
  
  # Test list command
  if node ./scripts/roo-duplicates.js list | grep -q "operations"; then
    echo "✅ roo-duplicates.js list command works"
  else
    echo "❌ roo-duplicates.js list command failed"
    exit 1
  fi
  
  echo "✅ Progress Backfilling System tests passed"
else
  echo "❌ roo-duplicates.js not found"
  exit 1
fi

echo ""

# Test Historical Code Analysis System
echo "📋 Testing Historical Code Analysis System..."
echo ""

if [ -f "./scripts/roo-history-analyze.js" ]; then
  echo "✅ roo-history-analyze.js exists"
  
  # Test help command
  if node ./scripts/roo-history-analyze.js --help | grep -q "analyze"; then
    echo "✅ roo-history-analyze.js help command works"
  else
    echo "❌ roo-history-analyze.js help command failed"
    exit 1
  fi
  
  # Test list command
  if node ./scripts/roo-history-analyze.js list | grep -q "operations"; then
    echo "✅ roo-history-analyze.js list command works"
  else
    echo "❌ roo-history-analyze.js list command failed"
    exit 1
  fi
  
  echo "✅ Historical Code Analysis System tests passed"
else
  echo "❌ roo-history-analyze.js not found"
  exit 1
fi

echo ""

# Test Complete Analysis System
echo "📋 Testing Complete Analysis System..."
echo ""

if [ -f "./scripts/roo-complete-analysis.js" ]; then
  echo "✅ roo-complete-analysis.js exists"
  
  # Test help command
  if node ./scripts/roo-complete-analysis.js --help | grep -q "analyze"; then
    echo "✅ roo-complete-analysis.js help command works"
  else
    echo "❌ roo-complete-analysis.js help command failed"
    exit 1
  fi
  
  # Test list command
  if node ./scripts/roo-complete-analysis.js list | grep -q "operations"; then
    echo "✅ roo-complete-analysis.js list command works"
  else
    echo "❌ roo-complete-analysis.js list command failed"
    exit 1
  fi
  
  echo "✅ Complete Analysis System tests passed"
else
  echo "❌ roo-complete-analysis.js not found"
  exit 1
fi

echo ""

# Test documentation
echo "📋 Testing Documentation..."
echo ""

if [ -f "./docs/progress-backfilling-system.md" ]; then
  echo "✅ Progress Backfilling System documentation exists"
else
  echo "❌ Progress Backfilling System documentation not found"
  exit 1
fi

if [ -f "./docs/historical-code-analysis-system.md" ]; then
  echo "✅ Historical Code Analysis System documentation exists"
else
  echo "❌ Historical Code Analysis System documentation not found"
  exit 1
fi

if [ -f "./docs/complete-analysis-system.md" ]; then
  echo "✅ Complete Analysis System documentation exists"
else
  echo "❌ Complete Analysis System documentation not found"
  exit 1
fi

echo "✅ Documentation tests passed"
echo ""

# Test GitHub Actions workflow
echo "📋 Testing GitHub Actions Workflow..."
echo ""

if [ -f "./.github/workflows/code-analysis.yml" ]; then
  echo "✅ GitHub Actions workflow exists"
else
  echo "❌ GitHub Actions workflow not found"
  exit 1
fi

echo ""

echo "🎉 All tests passed!"
echo "The Progress Backfilling System, Historical Code Analysis System, and Complete Analysis System are ready to use."
echo ""
echo "To run a complete analysis:"
echo "  ./scripts/roo-complete-analysis.js analyze"
echo ""
echo "For more information, see the documentation:"
echo "  - docs/progress-backfilling-system.md"
echo "  - docs/historical-code-analysis-system.md"
echo "  - docs/complete-analysis-system.md"