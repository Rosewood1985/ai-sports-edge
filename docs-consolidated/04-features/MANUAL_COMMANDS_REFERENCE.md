# AI Sports Edge - Manual Commands Reference

This document provides a comprehensive list of commands that need to be manually run by team members at different intervals. While many processes are automated via cron jobs, these commands may need manual execution for testing, verification, or special circumstances.

## Daily Commands

### Email System

```bash
# Test the daily email notification system
./notification-system/test-daily-email.command

# Manually generate the executive brief (normally automated at 6:50 AM)
./scripts/generate-executive-brief.sh

# Generate daily brief (normally automated)
./notification-system/scripts/generate-daily-brief.sh

# View today's brief
cat ./notification-system/reports/daily-brief-$(date '+%Y-%m-%d').md
```

### GPT Instruction Usage Tracking

```bash
# Log usage of a specific GPT instruction file
./scripts/track-gpt-usage.sh --log <instruction_file>
```

## Weekly Commands

### File Structure Monitoring

```bash
# Monitor file structure changes
./scripts/monitor-file-structure.sh

# Protect file structure from unauthorized changes
./scripts/protect-file-structure.sh
```

### Documentation Maintenance

```bash
# Consolidate GPT instruction files (GUI version)
./scripts/consolidate-gpt-instructions.command

# Consolidate GPT instruction files (CLI version)
./scripts/consolidate-gpt-instructions.sh
```

## Monthly Commands

### Review and Analysis

```bash
# Generate GPT instruction usage statistics
./scripts/track-gpt-usage.sh --stats

# Perform monthly GPT instructions review
./scripts/review-gpt-instructions.sh

# Create backup of consolidated documentation
./scripts/backup-docs-consolidated.sh
```

### Cron Job Verification

```bash
# Verify cron setup for AI Sports Edge
crontab -l | grep -i "ai sports edge"

# View full crontab configuration
crontab -l
```

## Automated Maintenance System

The project now includes a comprehensive automated maintenance system that can handle most routine tasks:

```bash
# Run the automated maintenance tool (interactive GUI)
./scripts/automated-maintenance.command

# Run daily maintenance tasks
./scripts/automated-maintenance.sh daily

# Run weekly maintenance tasks
./scripts/automated-maintenance.sh weekly

# Run monthly maintenance tasks
./scripts/automated-maintenance.sh monthly

# Run all maintenance tasks
./scripts/automated-maintenance.sh all

# Set up automated maintenance cron jobs
./scripts/setup-maintenance-cron.sh
```

The automated maintenance system:
- Runs tasks at scheduled intervals via cron
- Updates the task log (.roo-todo.md) automatically
- Maintains a detailed progress log
- Generates comprehensive reports

## GPT Template System

The project includes a template system for standardized GPT prompts and tasks:

```bash
# Launch the template manager GUI
./scripts/template-manager.command

# List all available templates
./scripts/template-manager.sh list

# View a specific template
./scripts/template-manager.sh view <template_name>

# Create a new template
./scripts/template-manager.sh create <template_name>

# Use a specific template
./scripts/template-manager.sh use <template_name>
```

Available templates:
- `admin-dashboard-session` - For analyzing admin dashboard components
- `file-analysis-session` - For organizing and categorizing files

The template system:
- Maintains standardized prompts for common tasks
- Tracks template usage in logs
- Updates the task log automatically
- Integrates with the maintenance system

## As-Needed Commands

### System Setup

```bash
# Set up cron jobs for documentation consolidation
./scripts/setup-docs-cron.sh

# Update consolidation script
./scripts/update-consolidation-script.sh
```

## Automation Status

The following tasks are already automated via cron jobs:

1. **Executive Brief Generation** - Runs daily at 6:50 AM
2. **Daily Email Delivery** - Runs daily at 7:00 AM
3. **Daily Maintenance** - Runs daily at 6:00 AM
   - File structure monitoring
   - Daily progress log updates
   - Executive brief generation
4. **Weekly Maintenance** - Runs weekly on Mondays at 4:00 AM
   - File structure protection
   - GPT instructions consolidation
   - GPT usage statistics generation
5. **Monthly Maintenance** - Runs monthly on the 1st at 3:00 AM
   - GPT instructions review
   - Documentation backup
6. **File Structure Monitoring** - Runs daily at 11:59 PM
7. **File Structure Protection** - Runs weekly on Sundays at 2:00 AM
8. **Documentation Consolidation** - Runs weekly on Mondays at 3:00 AM and monthly on the 1st at 2:00 AM

## Notes

- All commands should be run from the project root directory: `/Users/lisadario/Desktop/ai-sports-edge/`
- Log files are stored in the `/logs/` directory
- For any issues with automated processes, check the corresponding log files first
- The automated maintenance system maintains a rolling task log in `.roo-todo.md`
- Progress is tracked in `/status/maintenance-progress.md`
- Templates are stored in `/gpt-templates/` directory

Last updated: May 10, 2025