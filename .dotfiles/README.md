# AI Sports Edge Dotfiles

This directory contains configuration files for the AI Sports Edge development environment. These dotfiles ensure consistent CLI behavior, terminal aliases, and context management across dev container rebuilds.

## Overview

The dotfiles structure provides:

- Persistent command aliases (`roo`, `save`, `migrate`)
- Custom bash functions for common tasks
- Git configuration
- Vim settings
- Automatic environment setup
- Context persistence across sessions
- Context synchronization between memory-bank and source code

## Installation

To install the dotfiles, run:

```bash
cd /workspaces/ai-sports-edge/.dotfiles
chmod +x install.sh
./install.sh
```

After installation, reload your shell:

```bash
source ~/.bashrc
```

## What's Included

### .bashrc

The main bash configuration file that:
- Sources global definitions
- Sets up the AI Sports Edge environment
- Loads aliases and functions
- Configures an enhanced prompt with git branch
- Autoloads .env from project root
- Displays a welcome message
- Initializes memory bank on startup
- Restores context from activeContext.md and todo.json
- Checks for ROO-* markers in recently modified files

### .bash_aliases

Contains useful aliases:

#### Context Management Aliases
- `roo` - Update context with current state
- `save` - Save current context with optional message
- `migrate` - Run migration and update context
- `sync-context` - Sync context between memory-bank and source code tags
- `check-markers` - Check for ROO-* markers in recently modified files
- `update-from-markers` - Update memory bank from ROO-* markers
- `check-health` - Check project health
- `view-context` - View active context
- `add-context` - Add a context tag to a file
- `add-task` - Add a task tag to a file
- `mark-migrated` - Mark a file as migrated
- `mark-cleaned` - Mark a file as cleaned
- `scan-tags` - Scan for tags and update memory bank

#### Task Management Aliases
- `tasks` - List all tasks
- `task-add` - Add a new task
- `task-update` - Update a task field
- `task-complete` - Mark a task as completed
- `task-search` - Search for tasks
- `task-pending` - List pending tasks
- `task-progress` - List in-progress tasks
- `task-done` - List completed tasks

#### Navigation Shortcuts
- `cdroot` - Navigate to project root
- `cdscripts` - Navigate to scripts directory
- `cdtools` - Navigate to tools directory
- `cdmem` - Navigate to memory-bank directory
- `cdatomic` - Navigate to atomic directory
- `cdcomponents` - Navigate to components directory
- `cdservices` - Navigate to services directory
- `cdhooks` - Navigate to hooks directory
- `cddocs` - Navigate to docs directory
- `cdlogs` - Navigate to logs directory

#### Git Shortcuts
- `gs` - Git status
- `ga` - Git add
- `gc` - Git commit with message
- `gp` - Git push
- `gl` - Git pull
- `gd` - Git diff
- `gb` - Git branch
- `gco` - Git checkout
- `glog` - Git log with graph
- `gsync` - Git pull and push

#### Project-specific Shortcuts
- `update-context` - Update context with current state
- `checkpoint` - Create a context checkpoint
- `find-candidates` - Find consolidation candidates
- `deploy-firebase` - Deploy to Firebase
- `deploy-godaddy` - Deploy to GoDaddy via SFTP
- `test-app` - Run tests
- `start-app` - Start the app
- `build-app` - Build the app

#### Logging Aliases
- `view-logs` - View context synchronization logs
- `tail-logs` - Tail context synchronization logs
- `clear-logs` - Clear context synchronization logs

### .bash_functions

Contains useful functions:

#### Context Management Functions
- `log_context_sync message` - Log a message to the context sync log
- `update_context [message]` - Update memory bank with current context
- `save_context [message]` - Save current context with a message
- `sync_context` - Sync context between memory-bank files and source code tags
- `check_markers [directory] [hours]` - Check for ROO-* markers in recently modified files
- `update_from_markers` - Update memory bank files based on found markers
- `check_health` - Check project health

#### File Operations
- `find_files pattern [directory]` - Find files by pattern
- `search_content pattern [directory]` - Search file contents

#### Project Operations
- `run_migration path/to/file.ts` - Run migration for a file
- `create_component Name [level]` - Create a new component
- `list_commands` - Show available commands (alias: `commands`)

### .gitconfig

Git configuration with:
- User information (placeholder)
- Core settings
- Color settings
- Pull/push settings
- Useful aliases
- Merge and diff tool configuration

### .vimrc

Vim configuration with:
- General settings
- Indentation settings
- Display settings
- Key mappings
- Project-specific settings

## Context Management System

The dotfiles integrate with the continuous context system to ensure context persistence across sessions and provide a seamless experience for developers.

### Context Initialization

On startup, the `.bashrc` file:
1. Checks for and initializes the memory-bank if it doesn't exist
2. Restores the last known context from `activeContext.md` and `todo.json`
3. Logs startup timestamp to `logs/roo-context-sync.log`

### Context Synchronization

The `.bash_functions` file provides functions for:
1. Syncing context between memory-bank files and source code tags
2. Checking for ROO-* markers in recently modified files
3. Updating memory-bank files based on found markers

### Context Logging

The context logging system:
1. Records context synchronization events
2. Tracks when context is restored or updated
3. Logs errors or warnings during synchronization

### Usage Examples

```bash
# Update context with current state
roo

# Save context with a message
save "Completed Firebase authentication implementation"

# Check for ROO-* markers in recently modified files
check-markers

# Sync context between memory-bank and source code
sync-context

# View active context
view-context

# Check project health
check-health

# View context synchronization logs
view-logs
```

## Customization

You can customize these dotfiles to suit your preferences:

1. Edit the files in the `.dotfiles` directory
2. Run `./install.sh` to update the symlinks
3. Reload your shell with `source ~/.bashrc`

## Troubleshooting

### Permissions Issues

If you encounter permission issues:

```bash
chmod +x .dotfiles/install.sh
chmod +x scripts/*.sh
```

### Symlink Issues

If symlinks aren't working correctly:

```bash
# Check symlinks
ls -la ~ | grep -e "\.bash" -e "\.vim" -e "\.git"

# Manually create symlinks if needed
ln -sf /workspaces/ai-sports-edge/.dotfiles/.bashrc ~/.bashrc
```

### Path Issues

If commands aren't found:

```bash
# Check if AISPORTSEDGE_ROOT is set correctly
echo $AISPORTSEDGE_ROOT

# Set it manually if needed
export AISPORTSEDGE_ROOT="/workspaces/ai-sports-edge"
```

### Context Issues

If context synchronization isn't working:

```bash
# Check if logs directory exists
mkdir -p /workspaces/ai-sports-edge/logs

# Check context sync log
cat /workspaces/ai-sports-edge/logs/roo-context-sync.log

# Force context update
source ~/.bash_functions && update_context --force
```

## Dev Container Rebuild Notes

When rebuilding the dev container:

1. The dotfiles will persist as they're stored in the project directory
2. Run `.dotfiles/install.sh` after container rebuild to restore symlinks
3. Source your bashrc: `source ~/.bashrc`
4. Context will be automatically restored on startup

For more details on dev container rebuilds, see `docs/dev-container-rebuild-instructions.md`.