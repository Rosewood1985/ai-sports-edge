#!/bin/bash

# Direct deployment script to fix webapp sync issues
echo "🚀 Starting direct deployment to fix webapp sync..."

# Check if we have the required files
echo "📋 Checking files..."
if [ ! -f "public/index.html" ]; then
    echo "❌ Error: public/index.html not found"
    exit 1
fi

if [ ! -f "public/styles.css" ]; then
    echo "❌ Error: public/styles.css not found"
    exit 1
fi

if [ ! -f "public/neon-ui.css" ]; then
    echo "❌ Error: public/neon-ui.css not found"
    exit 1
fi

echo "✅ Required files found"

# Verify our CSS has the correct neon theme
echo "🔍 Verifying neon theme in CSS..."
if grep -q "#00F0FF" public/styles.css; then
    echo "✅ Neon theme (#00F0FF) found in styles.css"
else
    echo "❌ Neon theme not found in styles.css"
    exit 1
fi

# Show first few lines of CSS to verify
echo "📄 Current CSS theme colors:"
grep -A 3 ":root" public/styles.css | head -5

echo "🎯 This should show #00F0FF (neon blue) instead of #007bff (old blue)"
echo "📤 Ready for deployment"