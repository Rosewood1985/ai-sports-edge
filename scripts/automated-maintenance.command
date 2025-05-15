#!/bin/bash
# AI Sports Edge - Automated Maintenance Command
# User-friendly wrapper for the automated maintenance script

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BASE_DIR="$(dirname "$SCRIPT_DIR")"

# Change to the base directory
cd "$BASE_DIR" || exit 1

# Display header
echo "=================================================="
echo "    AI Sports Edge - Automated Maintenance Tool    "
echo "=================================================="
echo ""
echo "This tool automates various maintenance tasks and updates the task log."
echo ""

# Display menu
echo "Please select a maintenance option:"
echo ""
echo "1) Daily maintenance (file monitoring, progress log, executive brief)"
echo "2) Weekly maintenance (file protection, GPT consolidation, usage stats)"
echo "3) Monthly maintenance (GPT review, documentation backup)"
echo "4) Test email notification system"
echo "5) Run all maintenance tasks"
echo "q) Quit"
echo ""

# Get user selection
read -p "Enter your choice (1-5, q): " choice
echo ""

# Process selection
case "$choice" in
    1)
        echo "Running daily maintenance tasks..."
        "$SCRIPT_DIR/automated-maintenance.sh" daily
        ;;
    2)
        echo "Running weekly maintenance tasks..."
        "$SCRIPT_DIR/automated-maintenance.sh" weekly
        ;;
    3)
        echo "Running monthly maintenance tasks..."
        "$SCRIPT_DIR/automated-maintenance.sh" monthly
        ;;
    4)
        echo "Testing email notification system..."
        "$SCRIPT_DIR/automated-maintenance.sh" test-email
        ;;
    5)
        echo "Running all maintenance tasks..."
        "$SCRIPT_DIR/automated-maintenance.sh" all
        ;;
    q|Q)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid selection. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "Maintenance completed. Check logs for details."
echo ""
echo "Press any key to close this window..."
read -n 1 -s