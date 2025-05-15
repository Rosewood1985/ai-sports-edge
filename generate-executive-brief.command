#!/bin/bash
# Generate Executive Brief Command
# This command file makes it easy to generate the executive brief manually

# Change to the project directory
cd "$(dirname "$0")"

echo "🧠 AI Sports Edge - Generating Executive Brief..."
echo "=================================================="

# Run the executive brief generation script
./scripts/generate-executive-brief.sh

echo ""
echo "✅ Executive Brief generation complete!"
echo "📄 Brief location: ./docs-consolidated/05-business/FOUNDER_EXECUTIVE_BRIEF.md"
echo ""
echo "To view the brief, run:"
echo "open ./docs-consolidated/05-business/FOUNDER_EXECUTIVE_BRIEF.md"