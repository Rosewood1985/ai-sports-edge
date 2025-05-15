#!/bin/bash
# setup_workflow_system.sh
# Sets up the entire automated workflow system

echo "=========================================================="
echo "AI Sports Edge Automated Workflow System Setup"
echo "=========================================================="

# Make all scripts executable
echo "Making all scripts executable..."
chmod +x scripts/*.sh

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p archive
mkdir -p status/cron-logs
mkdir -p tasks
mkdir -p .git/hooks

# Initialize project files
echo "Initializing project files..."
touch .project_reminders
touch .project_phases
touch TODO.md

# Set up the project phases
echo "Setting up project phases..."
cat > .project_phases << END
1|File Organization|Completed
2|Firebase Consolidation|In Progress
3|Component Organization|Not Started
4|Code Quality Improvements|Not Started
5|Testing & Validation|Not Started
END

# Set up reminders
echo "Setting up reminders..."
cat > .project_reminders << END
- Complete Firebase consolidation
- Test authentication with new Firebase config
- Update GitHub Actions workflows
- Clean up project structure
- Run performance optimizations
END

# Set up TODO list
echo "Setting up TODO list..."
cat > TODO.md << END
# AI Sports Edge TODO List

## High Priority
- [ ] Consolidate Firebase implementations
- [ ] Fix GitHub Actions workflows
- [ ] Clean up project files and remove duplicates

## Medium Priority
- [ ] Improve error handling
- [ ] Add loading states
- [ ] Enhance mobile responsiveness

## Low Priority
- [ ] Add unit tests
- [ ] Optimize images
- [ ] Improve documentation
END

# Set up Git hooks
echo "Setting up Git hooks..."
./scripts/git_workflow_helper.sh hooks

# Set up cron job
echo "Setting up cron job for daily reminders..."
./scripts/setup_cron_job.sh

# Set up alias
echo "Setting up project alias..."
./scripts/setup_alias.sh

echo "=========================================================="
echo "AI Sports Edge Automated Workflow System Setup Complete!"
echo "=========================================================="
echo ""
echo "Available commands:"
echo "1. ./scripts/firebase_consolidation.sh - Consolidate Firebase implementations"
echo "2. ./scripts/git_workflow_helper.sh - Git and deployment automation"
echo "3. ./scripts/project_assistant.sh - Project status and reminders"
echo "4. ./scripts/systematic_process.sh - Guided process through all phases"
echo ""
echo "You can also use the 'edge' alias (after restarting terminal) to quickly access project tools"
echo ""
echo "Run ./scripts/systematic_process.sh to start the guided workflow"