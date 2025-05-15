#!/bin/bash
# AI Sports Edge .dotfiles installer
# This script creates symbolic links for dotfiles in the user's home directory

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the directory where this script is located
DOTFILES_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Log function
log() {
  local message="$1"
  local color="${2:-$BLUE}"
  echo -e "${color}${message}${NC}"
}

# Create a symbolic link
create_link() {
  local source_file="$1"
  local target_file="$2"
  
  # Check if the target file already exists
  if [ -e "$target_file" ]; then
    # If it's already a symlink to our file, do nothing
    if [ -L "$target_file" ] && [ "$(readlink "$target_file")" = "$source_file" ]; then
      log "Link already exists: $target_file -> $source_file" "$GREEN"
      return 0
    fi
    
    # Backup the existing file
    local backup_file="${target_file}.bak.$(date +%Y%m%d%H%M%S)"
    log "Backing up existing file: $target_file -> $backup_file" "$YELLOW"
    mv "$target_file" "$backup_file"
  fi
  
  # Create the symbolic link
  log "Creating link: $target_file -> $source_file" "$BLUE"
  ln -sf "$source_file" "$target_file"
  
  # Check if the link was created successfully
  if [ $? -eq 0 ]; then
    log "Link created successfully" "$GREEN"
    return 0
  else
    log "Failed to create link" "$RED"
    return 1
  fi
}

# Main installation function
install_dotfiles() {
  log "Installing AI Sports Edge dotfiles..." "$BLUE"
  
  # Create symbolic links for each dotfile
  create_link "$DOTFILES_DIR/.bashrc" "$HOME/.bashrc"
  create_link "$DOTFILES_DIR/.bash_aliases" "$HOME/.bash_aliases"
  create_link "$DOTFILES_DIR/.bash_functions" "$HOME/.bash_functions"
  create_link "$DOTFILES_DIR/.gitconfig" "$HOME/.gitconfig"
  create_link "$DOTFILES_DIR/.vimrc" "$HOME/.vimrc"
  
  # Make scripts executable
  log "Making scripts executable..." "$BLUE"
  chmod +x "$DOTFILES_DIR/install.sh"
  
  # Check if the scripts directory exists
  if [ -d "/workspaces/ai-sports-edge/scripts" ]; then
    log "Making project scripts executable..." "$BLUE"
    chmod +x /workspaces/ai-sports-edge/scripts/*.sh
  else
    log "Scripts directory not found. Skipping script permissions." "$YELLOW"
  fi
  
  # Set up environment variable
  if ! grep -q "AISPORTSEDGE_ROOT" "$HOME/.bashrc"; then
    log "Setting up AISPORTSEDGE_ROOT environment variable..." "$BLUE"
    echo 'export AISPORTSEDGE_ROOT="/workspaces/ai-sports-edge"' >> "$HOME/.bashrc"
  fi
  
  log "Installation complete!" "$GREEN"
  log "Please run 'source ~/.bashrc' to apply changes to your current session." "$YELLOW"
}

# Run the installation
install_dotfiles