# Firebase Atomic Migration Automation

This directory contains scripts for automating and standardizing the Firebase atomic architecture migration process. These scripts ensure consistent tagging, archiving, and tracking of migrated and consolidated files.

## Scripts Overview

### 1. `tag-headers.sh`

Adds standardized headers to migrated or consolidated files.

```bash
# Tag a migrated file
./scripts/tag-headers.sh migrated path/to/file.ts

# Tag a consolidated file
./scripts/tag-headers.sh consolidated path/to/file.ts "fileA.ts, fileB.ts"
```

### 2. `archive-redundant-files.sh`

Safely archives redundant files after migration or consolidation instead of deleting them.

```bash
# Archive one or more files
./scripts/archive-redundant-files.sh file1.ts file2.ts file3.ts
```

Files are moved to the `__archived` directory with a timestamp prefix and logged in `__archived/archive_log.md`.

### 3. `retro-tag-migrated.sh`

Retroactively tags all previously migrated files that don't have the standardized migration header yet.

```bash
# Tag all previously migrated files in the src directory
./scripts/retro-tag-migrated.sh

# Tag files in a specific directory
./scripts/retro-tag-migrated.sh path/to/directory
```

### 4. `consolidate-files.sh`

Handles the consolidation of multiple files into a single file, automatically tagging the consolidated file and archiving the original files.

```bash
# Consolidate multiple files into one
./scripts/consolidate-files.sh output_file.ts input_file1.ts input_file2.ts input_file3.ts
```

### 5. `migrate-firebase-atomic.sh` (Modified)

The existing migration script has been updated to automatically tag migrated files with the standardized header.

```bash
# Run the migration script
./scripts/migrate-firebase-atomic.sh
```

### 6. `migrate-and-update.sh`

A comprehensive workflow script that handles the entire migration process for a single file, including backup, migration, tagging, testing, and memory bank updates.

```bash
# Migrate a single file with full workflow
./scripts/migrate-and-update.sh path/to/file.ts
```

### 7. `update-firebase-migration-status.sh`

Updates the memory bank with information about the Firebase atomic migration progress by scanning the codebase to identify migrated and pending files.

```bash
# Update migration status in memory bank
./scripts/update-firebase-migration-status.sh
```

### 8. `accelerate-firebase-migration.sh`

Accelerates the Firebase atomic architecture migration by identifying, prioritizing, and batch-processing files that need migration.

```bash
# Run with default settings (batch size of 5, interactive mode)
./scripts/accelerate-firebase-migration.sh

# Run with custom batch size
./scripts/accelerate-firebase-migration.sh --batch-size=10

# Run in automatic mode without prompting
./scripts/accelerate-firebase-migration.sh --auto-confirm
```

### 9. `run-complete-migration.sh`

Runs the complete Firebase atomic architecture migration process from start to finish, including initialization, migration, and verification.

```bash
# Run with interactive prompts
./scripts/run-complete-migration.sh

# Run with automatic confirmation
./scripts/run-complete-migration.sh --auto-confirm

# Run with custom batch size
./scripts/run-complete-migration.sh --batch-size=10 --auto-confirm
```

## Header Formats

### Migrated Files

```typescript
// ✅ MIGRATED: Firebase Atomic Architecture
```

### Consolidated Files

```typescript
// 🧩 CONSOLIDATED: Merged from [fileA.ts, fileB.ts] on 2025-05-12
```

## Required Rules for Continuous Context

1. **Never migrate or consolidate a file without a header tag**
   - Always use the provided scripts to ensure proper tagging

2. **Never consolidate files without documenting origin**
   - Always use `consolidate-files.sh` which handles documentation automatically

3. **Never delete files — use archive-redundant-files.sh**
   - This preserves history and allows for recovery if needed

4. **Always run retro-tag-migrated.sh after major operations**
   - This ensures all files are properly tagged

5. **Maintain memory bank in sync**
   - Update relevant memory bank files after migration operations

## Workflow Examples

### Migrating a Single File with Full Workflow

```bash
# Use the comprehensive workflow script
./scripts/migrate-and-update.sh path/to/file.ts
```

This script will:
1. Create a backup of the file
2. Run the migration
3. Tag the file with the migration header
4. Run tests if available
5. Update the memory bank
6. Create a checkpoint
7. Verify the migration

### Migrating a Single File Manually

```bash
# Option 1: Use the migration script
./scripts/migrate-firebase-atomic.sh
# Then select option 3 and enter the file path

# Option 2: Manually migrate and then tag
# After manual migration:
./scripts/tag-headers.sh migrated path/to/file.ts
```

### Consolidating Multiple Files

```bash
# Consolidate multiple utility files into one
./scripts/consolidate-files.sh src/utils/firebaseUtils.ts src/utils/authUtils.ts src/utils/firestoreUtils.ts src/utils/storageUtils.ts
```

### Retroactively Tagging All Migrated Files

```bash
# Run before a major release to ensure all files are tagged
./scripts/retro-tag-migrated.sh
```

### Updating Migration Status in Memory Bank

```bash
# Update memory bank with current migration status
./scripts/update-firebase-migration-status.sh
```

This script will:
1. Scan the codebase for migrated and pending files
2. Update the activeContext.md file with the current focus and status
3. Update the progress.md file with detailed migration progress
4. Create a JSON file with machine-readable migration status

### Accelerating the Migration Process

```bash
# Run the accelerated migration process
./scripts/accelerate-firebase-migration.sh
```

This script will:
1. Identify all files that need migration
2. Prioritize them based on importance and complexity:
   - High priority: Services and files with direct Firebase usage
   - Medium priority: UI components, screens, and pages
   - Low priority: Everything else
3. Migrate files in batches (default: 5 files per batch)
4. Update the memory bank after each batch
5. Create checkpoints for recovery
6. Run retroactive tagging at the end

For large projects, you can run in automatic mode:
```bash
./scripts/accelerate-firebase-migration.sh --auto-confirm --batch-size=10
```

### Running the Complete Migration Process

```bash
# Run the complete migration process
./scripts/run-complete-migration.sh
```

This script orchestrates the entire migration process by running all the necessary steps in sequence:

1. Initialize memory bank
2. Run retroactive tagging on existing migrated files
3. Update migration status
4. Run accelerated migration
5. Final retroactive tagging
6. Final update of migration status
7. Create memory bank checkpoint

For unattended operation:
```bash
./scripts/run-complete-migration.sh --auto-confirm --batch-size=20
```

## Integration with CI/CD

Consider adding these steps to your CI/CD pipeline:

1. Run `retro-tag-migrated.sh` to ensure all files are properly tagged
2. Run `update-firebase-migration-status.sh` to update the memory bank
3. Check for untagged files that use Firebase atomic architecture
4. Verify that no files have been deleted instead of archived

## Troubleshooting

If you encounter issues with the scripts:

1. Check that all scripts have executable permissions (`chmod +x scripts/*.sh`)
2. Ensure the scripts are run from the project root directory
3. Check the logs in `status/firebase-atomic-migration.log`