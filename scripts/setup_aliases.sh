#!/bin/bash
# setup_aliases.sh - Set up project aliases

PROJECT_ROOT=$(pwd)

# Function to add aliases to shell config
add_aliases() {
  local config_file="$1"
  
  if [ -f "$config_file" ]; then
    # Check if aliases already exist
    if grep -q "# AI Sports Edge aliases" "$config_file"; then
      echo "Aliases already exist in $config_file"
      return 0
    fi
    
    # Add aliases
    cat >> "$config_file" << END

# AI Sports Edge aliases
alias edge-init='cd $PROJECT_ROOT && ./scripts/initialize_project.sh'
alias edge-start='cd $PROJECT_ROOT && ./scripts/start.sh'
alias edge-status='cd $PROJECT_ROOT && ./scripts/initialize_project.sh'
END
    
    echo "Aliases added to $config_file"
    return 0
  fi
  
  return 1
}

# Try to add aliases to common shell config files
added=0

add_aliases "$HOME/.bashrc" && added=1
add_aliases "$HOME/.zshrc" && added=1
add_aliases "$HOME/.bash_profile" && added=1

if [ $added -eq 0 ]; then
  echo "Could not find shell config file. Please add aliases manually."
  exit 1
fi

echo "Aliases added successfully. Please restart your terminal or run 'source ~/.bashrc' (or your shell config file)."
echo "Then you can use aliases like 'edge-init' and 'edge-start' from anywhere."