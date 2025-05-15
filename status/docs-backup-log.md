# Documentation Backup Log

This file tracks all backups of the consolidated documentation.

## Backup History

| Date | Time | Location | Files | Notes |
|------|------|----------|-------|-------|
| May 10, 2025 | 4:11 PM | ~/Desktop/ai-sports-edge/docs-consolidated-backup-20250510 | 2,767 | Initial backup after consolidation |

## Backup Process

Backups are created using the `./scripts/backup-docs-consolidated.sh` script, which:

1. Creates a date-stamped copy of the consolidated documentation
2. Logs the backup details in this file
3. Provides a summary of the backup operation

## Retention Policy

- Daily backups are retained for 7 days
- Weekly backups are retained for 4 weeks
- Monthly backups are retained for 12 months
- Annual backups are retained indefinitely

## Restoration Process

To restore from a backup:

1. Identify the appropriate backup directory
2. Replace the current docs-consolidated directory with the backup:

```bash
# Replace YYYYMMDD with the backup date
rm -rf ~/Desktop/ai-sports-edge/docs-consolidated
cp -r ~/Desktop/ai-sports-edge/docs-consolidated-backup-YYYYMMDD ~/Desktop/ai-sports-edge/docs-consolidated
```

3. Update the last consolidation date in the master index file