#!/bin/bash
# consolidate-gpt-instructions.command
#
# This command file provides a convenient way to run the GPT instructions
# consolidation script from Finder or the desktop.

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BASE_DIR="$(dirname "$SCRIPT_DIR")"

# Change to the base directory
cd "$BASE_DIR" || exit 1

# Run the consolidation script
"$SCRIPT_DIR/consolidate-gpt-instructions.sh"

# Keep the terminal window open until the user presses a key
echo ""
echo "Press any key to close this window..."
read -n 1 -s