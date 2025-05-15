# Firebase Atomic Migration Guide

This document provides guidance on migrating service files to the Firebase atomic architecture.

## Overview

The Firebase atomic migration is a process of refactoring our codebase to use a centralized, atomic architecture for Firebase interactions. This improves code organization, maintainability, and testability while preserving all existing functionality.

## Migration Process

### Automated Migration

We have a script that automates most of the migration process:

```bash
# Migrate a single file
./scripts/migrate-and-update.sh --file=services/yourServiceFile.ts

# Migrate multiple files in a directory
./scripts/migrate-and-update.sh --directory=services --limit=5 --skip=10
```

The script will:
1. Identify Firebase imports and usage in the specified file(s)
2. Replace direct Firebase imports with imports from the atomic architecture
3. Replace direct Firebase method calls with calls to the atomic Firebase service
4. Update Firebase initialization code to use the atomic Firebase service
5. Update the progress tracking and context automatically

### Manual Review

After the automated migration, you should manually review the migrated files to ensure:

1. All Firebase functionality is preserved
2. The code follows the established patterns
3. Error handling is consistent
4. Type safety is maintained
5. The code is properly formatted

## Migration Patterns

All service file migrations follow these established patterns:

- Replace direct Firebase imports with imports from the atomic architecture
- Replace direct Firebase method calls with calls to the atomic Firebase service
- Update Firebase initialization code to use the atomic Firebase service
- Maintain the same functionality while improving code organization and testability

### Example: Before Migration

```typescript
import { auth, firestore } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const getUserData = async (userId: string) => {
  const userRef = doc(firestore, 'users', userId);
  const userDoc = await getDoc(userRef);
  return userDoc.data();
};
```

### Example: After Migration

```typescript
import { firebaseService } from '../src/atomic';

export const getUserData = async (userId: string) => {
  const userDoc = await firebaseService.firestore.getDoc('users', userId);
  return userDoc.data();
};
```

## Benefits

These migrations deliver several key benefits:

1. **Centralized Configuration**: All Firebase configuration is now managed in a single location
2. **Consistent Error Handling**: Standardized approach to error handling across services
3. **Simplified Testing**: Services can now be tested with mocked Firebase dependencies
4. **Improved Code Organization**: Clear separation of concerns with atomic architecture
5. **Reduced Duplication**: Eliminated redundant Firebase initialization code
6. **Better Type Safety**: Enhanced TypeScript typing for Firebase interactions

## Progress Tracking

Migration progress is tracked in two places:

1. `status/firebase-atomic-migration.md` - Overall migration status and statistics
2. `status/firebase-migration-progress.md` - Detailed log of each migration batch

## Troubleshooting

If you encounter issues during migration:

1. Check the console output for specific error messages
2. Verify that the atomic architecture components exist and are properly exported
3. Ensure that the Firebase functionality in the atomic architecture matches the original functionality
4. If necessary, manually modify the migrated file to fix any issues

## Next Steps

After completing the migration of all service files:

1. Add unit tests for the atomic components
2. Create integration tests to verify the migrated functionality
3. Update documentation to reflect the new architecture
4. Consider migrating UI components that directly use Firebase