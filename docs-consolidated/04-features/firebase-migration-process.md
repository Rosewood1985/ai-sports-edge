# Firebase Migration Process

This document outlines the process for migrating Firebase code to use the consolidated atomic architecture components.

## Overview

The AI Sports Edge codebase contains multiple Firebase implementations across different files. This migration process aims to consolidate these implementations into a single, consistent set of Firebase services using the atomic architecture pattern.

## Migration Tools

We've created several scripts to assist with the migration process:

1. **firebase-migration-tracker.sh**: Tracks the status of files being migrated
2. **migrate-to-firebase-service.js**: Analyzes files for Firebase usage
3. **create-migration-example.js**: Creates examples of how to migrate a file
4. **migrate-firebase-file.js**: Automatically migrates simple Firebase files
5. **test-migrated-files.js**: Runs tests for migrated files

## Migration Phases

The migration is divided into several phases:

1. **Critical Components**: Core Firebase configuration and initialization files
2. **Auth Services**: Authentication-related files
3. **Data Services**: Firestore and database-related files
4. **Storage Services**: File storage-related files
5. **Analytics Services**: Analytics and tracking-related files

## Step-by-Step Migration Process

### 1. Start a Migration Phase

```bash
./scripts/firebase-migration-tracker.sh start-phase critical_components
```

This will:
- Mark the phase as "in progress"
- Show a list of files to migrate in this phase

### 2. Analyze Files

For each file to be migrated, first analyze it to understand its Firebase usage:

```bash
node scripts/migrate-to-firebase-service.js --analyze src/path/to/file.js
```

This will:
- Detect Firebase services used in the file
- Identify imports and dependencies
- Determine migration complexity
- Generate a migration plan

### 3. Create Migration Example

For more complex files, create a migration example:

```bash
node scripts/create-migration-example.js src/path/to/file.js
```

This will:
- Create an example file showing how to migrate the code
- Add a note to the migration tracker

### 4. Migrate the File

For simple files, use the automatic migration script:

```bash
node scripts/migrate-firebase-file.js src/path/to/file.js
```

For complex files, manually migrate based on the example and migration plan.

### 5. Test the Migrated File

Run tests to ensure the migrated file works correctly:

```bash
./scripts/test-migrated-files.sh run-file src/path/to/file.test.js
```

### 6. Mark as Migrated or Deleted

After successful migration:

```bash
./scripts/firebase-migration-tracker.sh mark-migrated src/path/to/file.js
```

If the file is no longer needed:

```bash
./scripts/firebase-migration-tracker.sh mark-deleted src/path/to/file.js "Reason: Duplicate functionality"
git rm src/path/to/file.js
```

### 7. Add Notes

Add notes to the migration tracker as needed:

```bash
./scripts/firebase-migration-tracker.sh add-note src/path/to/file.js "Needs architectural discussion"
```

### 8. Check Status

Check the overall migration status:

```bash
./scripts/firebase-migration-tracker.sh status
```

### 9. Generate Report

Generate a migration report:

```bash
./scripts/firebase-migration-tracker.sh generate-report
```

### 10. Commit Changes

After migrating several files:

```bash
git add .
git commit -m "[Firebase] Migrate critical auth components"
```

## Atomic Architecture Components

The migration will use the following atomic architecture components:

### Atoms

- **firebaseApp.js**: Firebase app initialization

### Molecules

- **firebaseAuth.js**: Authentication services
- **firebaseFirestore.js**: Firestore database services
- **firebaseStorage.js**: File storage services
- **firebaseAnalytics.js**: Analytics services
- **errorTracking.js**: Error handling utilities

### Organisms

- **firebaseService.js**: Consolidated Firebase service
- **monitoringService.js**: Error tracking and monitoring

## Migration Guidelines

1. **Preserve Logic**: Ensure that the business logic is preserved during migration
2. **Simplify Interfaces**: Use the simpler interfaces provided by the atomic components
3. **Error Handling**: Use the standardized error handling from errorTracking.js
4. **Testing**: Ensure all migrated code has appropriate tests
5. **Documentation**: Update documentation to reflect the new architecture

## Common Migration Patterns

### Authentication

**Before:**
```javascript
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const auth = getAuth();
signInWithEmailAndPassword(auth, email, password)
  .then((userCredential) => {
    // Handle success
  })
  .catch((error) => {
    // Handle error
  });
```

**After:**
```javascript
import { signIn } from '../atomic/molecules/firebaseAuth';

signIn(email, password)
  .then((userCredential) => {
    // Handle success
  })
  .catch((error) => {
    // Handle error
  });
```

### Firestore

**Before:**
```javascript
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const db = getFirestore();
const querySnapshot = await getDocs(collection(db, 'users'));
querySnapshot.forEach((doc) => {
  console.log(doc.id, doc.data());
});
```

**After:**
```javascript
import { getCollection } from '../atomic/molecules/firebaseFirestore';

const users = await getCollection('users');
users.forEach((user) => {
  console.log(user.id, user.data);
});
```

## Troubleshooting

### Migration Fails

If automatic migration fails:
1. Check the error message
2. Look at the migration example
3. Manually migrate the file
4. Run tests to verify

### Tests Fail After Migration

If tests fail after migration:
1. Compare the original and migrated file
2. Check for logic differences
3. Verify that all Firebase calls are properly replaced
4. Update tests if necessary

## Conclusion

Following this structured approach will ensure a smooth migration of Firebase code to the atomic architecture pattern, resulting in a more maintainable and consistent codebase.