# Legacy Tasks Discovery Report

This document catalogs stale or legacy jobs, cron entries, shell loops, and VS Code tasks discovered during the system-wide search and reconciliation effort.

## Overview

As part of the ongoing effort to establish a single source of truth and clean up redundant efforts, this report identifies automation tasks that may be inactive, duplicated, or no longer needed.

## Cron Jobs

### Active Cron Jobs (.cronrc)

| Job Name | Schedule | Command | Status | Notes |
|----------|----------|---------|--------|-------|
| save-context | 3m | ./scripts/save-context.sh | Active | Autosaves development context |
| sync-tasks | 5m | ./scripts/sync-tasks-with-memory-bank.sh | Active | Syncs tasks with memory bank |
| tag-scan | 10m | ./scripts/tag-context.sh --auto | Active | Scans for tags in code |
| update-progress | 15m | ./scripts/clean-and-sort-progress.sh | Active | Updates progress tracking |
| log-summary | 30m | ./scripts/generate-summary-log.sh | Active | Generates summary logs |
| checkpoint | 1h | ./scripts/update-memory-bank.js --checkpoint | Active | Creates memory bank checkpoints |
| weekly-review | 12h | ./scripts/run-weekly-checks.sh | Active | Runs weekly system checks |
| security-audit | 24h | ./scripts/check-security-policies.sh | Active | Runs security audits |

### Inactive or Redundant Cron Jobs

| Job Name | File Path | Status | Notes |
|----------|-----------|--------|-------|
| rssFeedCronJob | jobs/rssFeedCronJob.js | Potentially inactive | RSS feed cron job, may be superseded by .cronrc |
| schedulePlayerPlusMinusUpdates | services/playerStatsService.ts | Function, not a job | Function to schedule updates, not a standalone job |
| scheduleReconnectionCheck | services/networkService.ts | Internal function | Internal reconnection logic, not a cron job |

## Shell Loops

| File Path | Loop Type | Status | Notes |
|-----------|-----------|--------|-------|
| scripts/consolidate_project_history.sh | Weekly cron | Potentially redundant | Sets up a weekly cron job that may overlap with .cronrc |
| scripts/maintain-context.sh | 30-minute cron | Potentially redundant | Sets up a cron job that may overlap with .cronrc |
| infrastructure/testing/testing-management.sh | Multiple cron jobs | Potentially inactive | Sets up multiple cron jobs for testing |
| infrastructure/security/security-management.sh | Multiple cron jobs | Potentially inactive | Sets up multiple cron jobs for security |

## VS Code Tasks

| Task Name | File Path | Status | Notes |
|-----------|-----------|--------|-------|
| No VS Code tasks found | N/A | N/A | No .vscode/tasks.json file found |

## Cloud Scheduled Jobs

| Job Name | File Path | Status | Notes |
|----------|-----------|--------|-------|
| prediction_schedule | functions/src/config.ts | Active | Cloud Function schedule for predictions |
| pick_of_day_schedule | functions/src/config.ts | Active | Cloud Function schedule for pick of the day |
| sendGameStartReminders | functions/notifications.js | Active | Cloud Function for game reminders |
| sendModelPerformanceUpdates | functions/notifications.js | Active | Cloud Function for performance updates |

## Recommendations

1. **Consolidate Cron Jobs**:
   - Review all cron jobs and consolidate into .cronrc where possible
   - Remove any redundant cron setup scripts

2. **Standardize Scheduling**:
   - Use .cronrc for local development tasks
   - Use Cloud Scheduler for production Firebase Functions
   - Remove direct crontab manipulation from scripts

3. **Clean Up Inactive Jobs**:
   - Verify if rssFeedCronJob.js is still needed
   - Remove any unused scheduling functions

4. **Add New Backfill Job**:
   - Add the new backfill-history job to .cronrc

## Action Items

1. Add the following entry to .cronrc:
   ```
   25m backfill-history ./scripts/update-app-history.sh
   ```

2. Review and potentially remove the following scripts:
   - scripts/consolidate_project_history.sh (cron setup portion)
   - scripts/maintain-context.sh (cron setup portion)

3. Verify if the following are still needed:
   - jobs/rssFeedCronJob.js

4. Document all active scheduling mechanisms in a central location