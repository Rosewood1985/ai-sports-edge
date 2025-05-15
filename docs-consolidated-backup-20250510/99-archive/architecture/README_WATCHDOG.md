# Documentation Watchdog System

This document explains the automated documentation monitoring system for AI Sports Edge.

## Overview

The Documentation Watchdog system ensures critical documentation files are always present in the repository, preventing accidental gaps during active development.

## How It Works

The system consists of two main components:

1. **Monitoring Script** (`/scripts/docs_watchdog.py`): Checks for critical documentation files and creates them if missing.
2. **Scheduling Script** (`/scripts/schedule_docs_watchdog.sh`): Sets up a daily cron job to run the monitoring script.

## Monitored Documentation

The following critical files are automatically monitored:

| File | Purpose |
|:--|:--|
| `INTERNAL_TEAM_STRUCTURE.md` | Defines core business and operational roles |
| `PRIVATE_GPTS.md` | Defines autonomous Private GPT roles and tasks |
| `GIT_HELPER_CHEATSHEET.md` | Daily Git workflow and best practices cheat sheet |
| `FOUNDER_OVERVIEW_v1.0.md` | Founder document outlining product, ML model, market, roadmap |

If any of these files are missing, the system will:

1. Create the file with placeholder content
2. Stage the file with git
3. Commit the file with a standardized message
4. Push the changes to the current branch

## Setting Up the Watchdog

To set up the daily documentation check:

```bash
# Make the scripts executable (if not already)
chmod +x scripts/docs_watchdog.py
chmod +x scripts/schedule_docs_watchdog.sh

# Run the scheduling script to set up the cron job
./scripts/schedule_docs_watchdog.sh
```

The script will:
- Create a cron job to run daily at 2 AM
- Create a logs directory if it doesn't exist
- Log all activity to `logs/docs_watchdog.log`
- Prevent duplicate cron entries

## Manual Execution

You can also run the watchdog manually at any time:

```bash
python3 scripts/docs_watchdog.py
```

## Customizing Monitored Files

To add or modify the list of critical documentation files, edit the `critical_docs` dictionary in `scripts/docs_watchdog.py`:

```python
critical_docs = {
    "FILENAME.md": "# Title\n\n(Placeholder content)",
    # Add more files here
}
```

## Benefits

- ✅ Ensures documentation completeness
- ✅ Automates routine documentation checks
- ✅ Maintains consistent documentation structure
- ✅ Prevents documentation debt
- ✅ Simplifies onboarding for new team members

## Last Updated

**Version:** v1.0  
**Date:** April 27, 2025