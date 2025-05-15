#!/bin/bash
# AI Sports Edge - Template Manager Command
# User-friendly wrapper for the template manager script

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BASE_DIR="$(dirname "$SCRIPT_DIR")"

# Change to the base directory
cd "$BASE_DIR" || exit 1

# Display header
echo "=================================================="
echo "    AI Sports Edge - GPT Template Manager Tool    "
echo "=================================================="
echo ""
echo "This tool helps manage GPT templates for specialized tasks."
echo ""

# Display menu
echo "Please select an option:"
echo ""
echo "1) List all available templates"
echo "2) View a specific template"
echo "3) Create a new template"
echo "4) Use a template"
echo "q) Quit"
echo ""

# Get user selection
read -p "Enter your choice (1-4, q): " choice
echo ""

# Process selection
case "$choice" in
    1)
        echo "Listing all available templates..."
        "$SCRIPT_DIR/template-manager.sh" list
        ;;
    2)
        read -p "Enter template name to view: " template_name
        echo ""
        "$SCRIPT_DIR/template-manager.sh" view "$template_name"
        ;;
    3)
        read -p "Enter new template name: " template_name
        echo ""
        "$SCRIPT_DIR/template-manager.sh" create "$template_name"
        ;;
    4)
        read -p "Enter template name to use: " template_name
        echo ""
        "$SCRIPT_DIR/template-manager.sh" use "$template_name"
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
echo "Press any key to close this window..."
read -n 1 -s