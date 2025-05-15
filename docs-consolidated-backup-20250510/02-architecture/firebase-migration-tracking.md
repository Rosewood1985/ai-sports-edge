# Firebase Migration Tracking System

## Overview

This document describes the Firebase migration tracking system for the AI Sports Edge project. The system helps track the progress of migrating from multiple Firebase implementations to the consolidated `firebaseService.ts` service.

## Components

The migration tracking system consists of the following components:

1. **Firebase Service**: The consolidated Firebase service located at `src/services/firebaseService.ts`
2. **Migration Scripts**: Scripts to help with the migration process
3. **Migration Database**: A JSON database to track migration progress
4. **Migration Reports**: Markdown reports showing migration status and test results

## Migration Scripts

### firebase-migration-tracker.sh

This script manages the migration process and tracks progress. It provides the following commands:

- `initialize`: Initialize the migration database
- `status`: Show migration status
- `start-phase <phase>`: Start a migration phase
- `mark-migrated <file>`: Mark a file as migrated
- `export-plan`: Export migration plan to memory bank
- `create-test <file>`: Create test template for a migrated file
- `generate-report`: Generate migration report
- `help`: Show help message

#### Usage Examples

```bash
# Initialize migration database
./scripts/firebase-migration-tracker.sh initialize

# Show migration status
./scripts/firebase-migration-tracker.sh status

# Start migration phase
./scripts/firebase-migration-tracker.sh start-phase critical_components

# Mark a file as migrated
./scripts/firebase-migration-tracker.sh mark-migrated src/config/firebase.js

# Export migration plan to memory bank
./scripts/firebase-migration-tracker.sh export-plan

# Create test template for a migrated file
./scripts/firebase-migration-tracker.sh create-test src/config/firebase.js

# Generate migration report
./scripts/firebase-migration-tracker.sh generate-report
```

### test-migrated-files.sh

This script runs tests for migrated files and generates a test report. It provides the following commands:

- `run`: Run tests for all migrated files
- `run-phase <phase>`: Run tests for a specific migration phase
- `help`: Show help message

#### Usage Examples

```bash
# Run tests for all migrated files
./scripts/test-migrated-files.sh run

# Run tests for a specific migration phase
./scripts/test-migrated-files.sh run-phase critical_components
```

### migrate-firebase-file.js

This script migrates a file to use the consolidated Firebase service. It replaces Firebase imports and usage with the consolidated service.

#### Usage Example

```bash
node scripts/migrate-firebase-file.js src/config/firebase.js
```

### migrate-to-firebase-service.js

This script analyzes the codebase for Firebase usage and generates a migration report.

#### Usage Example

```bash
node scripts/migrate-to-firebase-service.js
```

## Migration Database

The migration database is a JSON file located at `.roocode/firebase_migration.json`. It tracks the following information:

- Total files to migrate
- Files migrated
- Migration status
- Migration phases
- Migration log

## Migration Phases

The migration is divided into the following phases:

1. **Critical Components**: Core components with Firebase dependencies
2. **Data Services**: Services that interact with Firestore
3. **UI Components**: UI components with Firebase dependencies
4. **Utilities**: Utility functions using Firebase
5. **Remaining**: All remaining files

## Migration Process

1. Initialize the migration database:
   ```bash
   ./scripts/firebase-migration-tracker.sh initialize
   ```

2. Start the first migration phase:
   ```bash
   ./scripts/firebase-migration-tracker.sh start-phase critical_components
   ```

3. For each file in the phase:
   - Migrate the file:
     ```bash
     node scripts/migrate-firebase-file.js <file-path>
     ```
   - Create a test template:
     ```bash
     ./scripts/firebase-migration-tracker.sh create-test <file-path>
     ```
   - Implement the test
   - Mark the file as migrated:
     ```bash
     ./scripts/firebase-migration-tracker.sh mark-migrated <file-path>
     ```

4. Run tests for the phase:
   ```bash
   ./scripts/test-migrated-files.sh run-phase critical_components
   ```

5. Repeat steps 2-4 for each phase

6. Generate the final migration report:
   ```bash
   ./scripts/firebase-migration-tracker.sh generate-report
   ```

## Migration Reports

The migration tracking system generates the following reports:

- **Migration Status Report**: Located at `reports/firebase_migration_status.md`
- **Test Report**: Located at `reports/firebase_migration_tests.md`

## Memory Bank Integration

The migration tracking system integrates with the memory bank to store migration plans and track progress. The following memory bank entries are created:

- **Firebase Migration > Migration Plan**: The migration plan
- **Firebase Migration > Phase: <phase>**: Started migration phase
- **Firebase Migration > <file>**: Migrated file

## Troubleshooting

If you encounter any issues with the migration tracking system:

1. Check the migration database for errors
2. Run the `status` command to see the current migration status
3. Check the migration reports for more information
4. If necessary, re-initialize the migration database

## References

- [Firebase Consolidation Documentation](./firebase-consolidation.md)
- [Firebase Migration Guide](./firebase-migration-guide.md)