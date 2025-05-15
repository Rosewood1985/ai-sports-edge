#!/bin/bash

# Script to load project context at the start of a new Roo Code session
# Usage: /workspaces/ai-sports-edge/scripts/load-context.sh

echo "===================================================="
echo "LOADING AI SPORTS EDGE PROJECT CONTEXT"
echo "===================================================="
echo ""
cat /workspaces/ai-sports-edge/.context/master-context.md
echo ""
echo "===================================================="
echo "QUICK REFERENCE COMMANDS"
echo "===================================================="
echo ""
cat /workspaces/ai-sports-edge/.context/quick-commands.md
echo ""
echo "===================================================="
echo "FILE CONSOLIDATION PHASE"
echo "===================================================="
echo ""
cat /workspaces/ai-sports-edge/.context/prompts/file-consolidation.md
echo ""
echo "===================================================="
echo "TIP: You can now simply run './roo' at the start of each new Roo Code session!"