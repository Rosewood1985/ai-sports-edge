#!/bin/bash

# display-diagnostic-summary.sh
# Displays a formatted summary of the AI Sports Edge Dev Container Diagnostic Report

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

REPORT_PATH="/workspaces/ai-sports-edge/ai-sports-edge-dev-container-diagnostic-report.md"

if [ ! -f "$REPORT_PATH" ]; then
  echo -e "${RED}Error: Diagnostic report not found at $REPORT_PATH${NC}"
  exit 1
fi

echo -e "${BOLD}${CYAN}====================================${NC}"
echo -e "${BOLD}${CYAN}  AI SPORTS EDGE DIAGNOSTIC SUMMARY ${NC}"
echo -e "${BOLD}${CYAN}====================================${NC}"
echo ""

# File Structure Analysis
echo -e "${BOLD}${BLUE}📁 FILE STRUCTURE ANALYSIS${NC}"
echo -e "${YELLOW}Atomic Architecture Implementation:${NC}"
grep -A 4 "Atomic Architecture Implementation" "$REPORT_PATH" | tail -n 4 | sed 's/^[ \t]*/  /'
echo ""

echo -e "${YELLOW}Structural Anomalies:${NC}"
grep -A 4 "Structural Anomalies" "$REPORT_PATH" | tail -n 4 | sed 's/^[ \t]*/  /'
echo ""

# Script Ecosystem
echo -e "${BOLD}${BLUE}🔄 SCRIPT ECOSYSTEM${NC}"
echo -e "${YELLOW}Script Categories:${NC}"
grep -A 6 "Script Categories" "$REPORT_PATH" | tail -n 6 | sed 's/^[ \t]*/  /'
echo ""

# Command Interface
echo -e "${BOLD}${BLUE}⌨️ COMMAND INTERFACE${NC}"
echo -e "${YELLOW}Available Command Interfaces:${NC}"
echo -e "  - NPM Scripts: $(grep -o '".*"' package.json | wc -l) commands"
echo -e "  - Makefile Targets: $(grep -o "^[a-zA-Z0-9_-]*:" Makefile | wc -l) commands"
echo -e "  - Ops.ts CLI: $(grep -o "\.command(" tools/ops.ts | wc -l) commands"
echo ""

# Context System
echo -e "${BOLD}${BLUE}🔄 CONTINUOUS CONTEXT SYSTEM${NC}"
echo -e "${YELLOW}Memory Bank Files:${NC}"
grep -A 5 "Memory Bank Files" "$REPORT_PATH" | tail -n 5 | sed 's/^[ \t]*/  /'
echo ""

# Migration Progress
echo -e "${BOLD}${BLUE}🔀 MIGRATION PROGRESS${NC}"
echo -e "${YELLOW}Firebase Migration:${NC}"
if [ -f "status/firebase-atomic-migration-summary.md" ]; then
  TOTAL=$(grep "Total files requiring migration" status/firebase-atomic-migration-summary.md | grep -o "[0-9]*")
  MIGRATED=$(grep "Files migrated" status/firebase-atomic-migration-summary.md | grep -o "[0-9]*")
  PROGRESS=$(grep "Progress" status/firebase-atomic-migration-summary.md | grep -o "[0-9]*")
  
  echo -e "  - Total Files: ${TOTAL:-"N/A"}"
  echo -e "  - Migrated: ${MIGRATED:-"N/A"}"
  echo -e "  - Progress: ${PROGRESS:-"N/A"}%"
else
  echo -e "  ${RED}Migration summary not found${NC}"
fi
echo ""

# System Health
echo -e "${BOLD}${BLUE}✅ SYSTEM HEALTH${NC}"
echo -e "${YELLOW}Top Improvement Recommendations:${NC}"
grep -A 3 "Prioritized Improvement Recommendations" "$REPORT_PATH" | tail -n 3 | sed 's/^[0-9]\. /  /' | sed 's/^[ \t]*/  /'
echo ""

echo -e "${BOLD}${CYAN}====================================${NC}"
echo -e "${BOLD}${CYAN}  FULL REPORT: $REPORT_PATH ${NC}"
echo -e "${BOLD}${CYAN}====================================${NC}"