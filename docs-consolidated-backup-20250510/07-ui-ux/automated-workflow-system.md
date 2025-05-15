# AI Sports Edge Automated Workflow System

This document provides an overview of the automated workflow system for the AI Sports Edge project, focusing on Firebase consolidation and development workflow automation.

## Overview

The automated workflow system consists of several scripts that work together to:

1. Consolidate Firebase implementations
2. Automate Git workflows
3. Provide project status and reminders
4. Guide through project phases systematically

## Scripts

### 1. Firebase Consolidation (`scripts/firebase_consolidation.sh`)

This script consolidates multiple Firebase implementations into a single, standardized implementation.

**Features:**
- Creates a backup branch before making changes
- Backs up all Firebase implementations
- Analyzes existing Firebase files
- Creates a standardized Firebase implementation
- Updates imports across the codebase
- Tests Firebase functionality
- Commits changes and optionally creates a PR
- Deploys to a test environment

**Usage:**
```bash
./scripts/firebase_consolidation.sh
```

### 2. Git Workflow Helper (`scripts/git_workflow_helper.sh`)

This script automates common Git workflow tasks.

**Features:**
- Sets up Git hooks for automatic actions
- Provides enhanced Git status information
- Syncs with remote repositories
- Performs smart commits and pushes
- Automates deployment to Firebase
- Interactive menu for easy access to functions

**Usage:**
```bash
# Interactive menu
./scripts/git_workflow_helper.sh

# Direct commands
./scripts/git_workflow_helper.sh status
./scripts/git_workflow_helper.sh sync
./scripts/git_workflow_helper.sh commit "Your commit message"
./scripts/git_workflow_helper.sh deploy preview
./scripts/git_workflow_helper.sh deploy prod
./scripts/git_workflow_helper.sh hooks
./scripts/git_workflow_helper.sh consolidate
```

### 3. Project Assistant (`scripts/project_assistant.sh`)

This script provides project status and reminders.

**Features:**
- Tracks pending tasks
- Checks for uncommitted changes
- Checks for unpushed commits
- Checks deployment status
- Shows project phase information
- Interactive menu for common tasks

**Usage:**
```bash
./scripts/project_assistant.sh
```

### 4. Systematic Process (`scripts/systematic_process.sh`)

This script guides through all project phases systematically.

**Features:**
- Tracks project phases and their status
- Provides detailed information about each phase
- Runs phase-specific scripts
- Updates phase status
- Interactive menu for phase management

**Usage:**
```bash
./scripts/systematic_process.sh
```

### 5. Setup Cron Job (`scripts/setup_cron_job.sh`)

This script sets up a cron job for daily reminders.

**Features:**
- Adds a cron job to run the project assistant at 9:00 AM daily
- Checks if the cron job already exists
- Shows all current cron jobs

**Usage:**
```bash
./scripts/setup_cron_job.sh
```

### 6. Setup Alias (`scripts/setup_alias.sh`)

This script sets up a project-specific alias for easy access to project tools.

**Features:**
- Adds an alias to your .bashrc file
- Checks if the alias already exists
- Shows the alias configuration

**Usage:**
```bash
./scripts/setup_alias.sh
```

## Getting Started

To set up the automated workflow system:

1. Make all scripts executable:
   ```bash
   chmod +x scripts/*.sh
   ```

2. Set up the project alias:
   ```bash
   ./scripts/setup_alias.sh
   ```

3. Set up daily reminders:
   ```bash
   ./scripts/setup_cron_job.sh
   ```

4. Start the systematic process:
   ```bash
   ./scripts/systematic_process.sh
   ```

## Project Phases

The project is divided into 5 phases:

1. **File Organization**
   - Organize project files
   - Remove duplicates
   - Set up project structure

2. **Firebase Consolidation**
   - Standardize Firebase implementation
   - Update imports
   - Test Firebase functionality

3. **Component Organization**
   - Implement atomic design
   - Consolidate duplicate components
   - Improve component hierarchy

4. **Code Quality Improvements**
   - Standardize error handling
   - Update deprecated patterns
   - Improve performance

5. **Testing & Validation**
   - Run unit tests
   - Validate functionality
   - Fix issues

## Quick Reference

- **Project Status**: `./scripts/project_assistant.sh`
- **Git Operations**: `./scripts/git_workflow_helper.sh`
- **Firebase Consolidation**: `./scripts/firebase_consolidation.sh`
- **Guided Process**: `./scripts/systematic_process.sh`
- **Quick Access**: `edge` (after setting up alias)

## Best Practices

1. **Always create backup branches** before making significant changes
2. **Commit frequently** with descriptive commit messages
3. **Test changes** in a preview environment before deploying to production
4. **Follow the systematic process** to ensure all phases are completed properly
5. **Check project status daily** using the project assistant

## Troubleshooting

If you encounter issues:

1. Check the logs in the `status` directory
2. Run `./scripts/git_workflow_helper.sh status` to see the current state
3. Use `git log` to see recent commits
4. Check the Firebase console for deployment issues