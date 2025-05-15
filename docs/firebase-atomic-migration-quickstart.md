# Firebase Atomic Migration Quick-Start Guide

This guide provides step-by-step instructions for migrating files to use the Firebase atomic architecture.

## Prerequisites

- Ensure you're on the correct branch: `feature/admin-atomic-architecture`
- Make sure all tests pass before starting migration
- Understand the [Firebase Atomic Architecture](./firebase-atomic-migration-guide.md)

## Migration Process

### 1. Prepare for Migration

```bash
# Create a new branch for this migration batch
git checkout -b firebase-atomic-migration-batch-1

# Run tests to establish baseline
npm test
```

### 2. Analyze Files to Migrate

```bash
# See which files need migration in a specific directory
node scripts/migrate-firebase-atomic-enhanced.js --directory=services --dry-run

# Analyze dependencies for a specific file
node scripts/migrate-firebase-atomic-enhanced.js --file=services/authService.ts --analyze-deps --dry-run
```

### 3. Migrate Files

Start with a dry run to see what would change:

```bash
# Dry run migration for a small batch
node scripts/migrate-firebase-atomic-enhanced.js --directory=services --limit=5 --dry-run
```

Then perform the actual migration:

```bash
# Migrate a small batch of files
node scripts/migrate-firebase-atomic-enhanced.js --directory=services --limit=5 --create-branch
```

### 4. Test After Migration

```bash
# Run tests after migration
npm test

# Or use the --test flag during migration
node scripts/migrate-firebase-atomic-enhanced.js --directory=services --limit=5 --test
```

### 5. Fix TypeScript Errors

The migration script will attempt to fix common issues, but you may need to manually address some TypeScript errors:

1. Check for type errors:
   ```bash
   tsc --noEmit
   ```

2. Common fixes:
   - Update type imports from Firebase to use the atomic architecture
   - Fix method signatures that differ between Firebase and the atomic architecture
   - Update references to Firebase objects

### 6. Commit Changes

```bash
# Stage changes
git add .

# Commit with a descriptive message
git commit -m "feat(firebase): Migrate services directory to atomic architecture"

# Push to remote
git push origin firebase-atomic-migration-batch-1
```

### 7. Create Pull Request

Create a PR from your migration branch to `feature/admin-atomic-architecture`.

## Migration Order

Follow this recommended order for migration:

1. ✅ Core configuration files (`config/firebase.js`, `config/firebase.ts`)
2. ✅ Authentication hooks (`hooks/useAuth.ts`)
3. 🔄 Service files (`services/*.ts`)
4. ⏳ Component files (`components/*.tsx`)
5. ⏳ Screen files (`screens/*.tsx`)

## Troubleshooting

### TypeScript Errors

- **Method signature mismatches**: Check the atomic architecture implementation for the correct method signature
- **Type errors**: Import types from `firebase/firestore` but use implementations from `firebaseService`
- **Import errors**: Ensure the import path to `firebaseService` is correct relative to the file

### Runtime Errors

- **Undefined methods**: Ensure the method exists in the atomic architecture
- **Authentication errors**: Verify that auth state is properly initialized
- **Firestore errors**: Check collection and document references

## Need Help?

- Check the [Firebase Atomic Migration Guide](./firebase-atomic-migration-guide.md)
- Review the [Testing Strategy](./firebase-atomic-migration-testing.md)
- See the [Migration Summary](../status/firebase-atomic-migration-summary.md)