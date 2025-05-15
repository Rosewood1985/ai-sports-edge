#!/bin/bash
# setup_alias.sh
# Sets up a project-specific alias for easy access to project tools

# Get the current directory
CURRENT_DIR=$(pwd)

# Create the alias entry
ALIAS_ENTRY="
# AI Sports Edge project helper alias
alias edge='cd $CURRENT_DIR && ./scripts/project_assistant.sh'"

# Check if the alias already exists
if grep -q "alias edge=" ~/.bashrc; then
  echo "Alias already exists in ~/.bashrc. Skipping..."
else
  # Add the alias to .bashrc
  echo "$ALIAS_ENTRY" >> ~/.bashrc
  echo "Alias added to ~/.bashrc!"
  echo "You can now use 'edge' command to quickly access project tools"
  echo "Please restart your terminal or run 'source ~/.bashrc' to apply changes"
fi

# Show the alias
echo ""
echo "Alias configuration:"
echo "alias edge='cd $CURRENT_DIR && ./scripts/project_assistant.sh'"