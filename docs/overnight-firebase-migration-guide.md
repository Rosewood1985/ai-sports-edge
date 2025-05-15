# Overnight Firebase Migration Guide

## Overview

This guide explains how to use the automated overnight Firebase migration system to continue the migration process while you're away. The current migration status is at **31%** (165 out of 532 files migrated), and the automated system can help accelerate this process.

## Components

The overnight migration system consists of the following components:

1. **Diagnostic Report**: `ai-sports-edge-dev-container-diagnostic-report.md`
   - Comprehensive analysis of the project structure, script ecosystem, and migration status
   - Created by running the diagnostic process

2. **Diagnostic Summary Script**: `scripts/display-diagnostic-summary.sh`
   - Provides a formatted overview of key metrics and findings
   - Run this script to quickly check the current status

3. **Overnight Migration Script**: `scripts/overnight-firebase-migration.sh`
   - Automates the migration process in batches
   - Includes safety limits to prevent too many migrations at once
   - Creates detailed logs and summaries

4. **Cron Setup Script**: `scripts/setup-overnight-migration-cron.sh`
   - Sets up a scheduled job to run the migration process at a specific time
   - Creates necessary directory structure and documentation

## Setting Up Overnight Migration

### Option 1: One-time Manual Run

To run the migration process once without scheduling:

```bash
# Run with default settings (5 files per batch, 10 batches maximum)
./scripts/overnight-firebase-migration.sh

# Run with custom settings
./scripts/overnight-firebase-migration.sh --batch-size=3 --max-batches=5
```

### Option 2: Scheduled Nightly Runs

To set up a scheduled nightly migration process:

```bash
# Schedule to run at 1:00 AM with default settings
./scripts/setup-overnight-migration-cron.sh

# Schedule with custom time and settings
./scripts/setup-overnight-migration-cron.sh --hour=2 --minute=30 --batch-size=3 --max-batches=5
```

## Morning Review Process

When you return in the morning, follow these steps to review the migration progress:

1. **Check the migration summary**:
   ```bash
   # Find the latest summary file
   ls -lt status/overnight-migration/overnight-migration-summary-*.md | head -1
   
   # View the summary
   cat $(ls -lt status/overnight-migration/overnight-migration-summary-*.md | head -1 | awk '{print $9}')
   ```

2. **View the current status**:
   ```bash
   ./scripts/display-diagnostic-summary.sh
   ```

3. **Update the memory bank**:
   ```bash
   npm run memory:update
   ```

4. **Create a memory bank checkpoint**:
   ```bash
   npm run memory:checkpoint
   ```

## Customizing the Migration Process

### Adjusting Batch Size

The batch size determines how many files are migrated in each batch. A smaller batch size is safer but slower, while a larger batch size is faster but riskier.

```bash
# Set a smaller batch size (safer)
./scripts/overnight-firebase-migration.sh --batch-size=3

# Set a larger batch size (faster)
./scripts/overnight-firebase-migration.sh --batch-size=10
```

### Limiting Total Migrations

The max-batches parameter limits the total number of batches processed in a single run. This prevents the migration from running too long or processing too many files at once.

```bash
# Process fewer batches (more conservative)
./scripts/overnight-firebase-migration.sh --max-batches=5

# Process more batches (more aggressive)
./scripts/overnight-firebase-migration.sh --max-batches=20
```

### Changing the Schedule

To change when the migration runs:

```bash
# Run at 2:30 AM instead of the default 1:00 AM
./scripts/setup-overnight-migration-cron.sh --hour=2 --minute=30
```

### Disabling Scheduled Migration

To disable the scheduled migration:

```bash
crontab -l | grep -v "overnight-firebase-migration" | crontab -
```

## Troubleshooting

### Checking Logs

If the migration encounters issues, check the logs:

```bash
# List all log files
ls -lt status/overnight-migration/

# View the latest log file
cat $(ls -lt status/overnight-migration/overnight-migration-*.log | head -1 | awk '{print $9}')
```

### Restoring from Backup

If files are corrupted during migration, they can be restored from backups:

```bash
# Find backups for a specific file
find . -name "filename.js.bak.*"

# Restore from a backup
cp filename.js.bak.20250513012345 filename.js
```

### Manual Migration

If the automated process fails, you can still migrate files manually:

```bash
# Migrate a single file
./scripts/migrate-firebase-atomic.sh
# Then select option 3 and enter the file path
```

## Next Steps

1. **Set up the overnight migration** using one of the methods above
2. **Review progress in the morning** using the display-diagnostic-summary.sh script
3. **Continue manual migration** for any files that couldn't be automatically migrated
4. **Update the memory bank** to track progress

## Additional Resources

- **Firebase Atomic Migration README**: `scripts/firebase-atomic-migration-README.md`
- **Diagnostic Report**: `ai-sports-edge-dev-container-diagnostic-report.md`
- **Migration Logs**: `status/overnight-migration/`