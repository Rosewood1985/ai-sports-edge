# Firebase Service FAQ

## General Questions

### Why did we consolidate Firebase usage?

We consolidated Firebase usage to improve:
- **Type safety**: Better TypeScript support
- **Performance**: Lazy loading of Firebase services
- **Testability**: Easier to mock in tests
- **Maintainability**: Single source of truth for Firebase configuration
- **Consistency**: Standardized API for Firebase interactions

### How many files are being migrated?

227 files that use Firebase directly are being migrated to use the consolidated service.

### Can I still use Firebase directly?

No, direct Firebase usage should be avoided. Always use the `firebaseService` instead.

## Migration Questions

### How do I migrate my component to use the new Firebase service?

1. Replace Firebase imports with `import { firebaseService } from '../../services/firebaseService'`
2. Replace direct Firebase calls with equivalent firebaseService methods
3. Test your component to ensure it works as expected
4. Mark your file as migrated using `./scripts/firebase-migration-tracker.sh mark-migrated <file-path>`

### What if I need Firebase functionality that's not in the service?

If you need functionality that's not currently in the firebaseService:
1. First, check the [Firebase Service Documentation](../docs/firebase-service.md) to make sure it's not already there
2. Add the functionality to firebaseService.ts
3. Create a PR with your changes
4. Update the documentation

### How do I test components that use the Firebase service?

Mock the firebaseService in your tests:

```typescript
jest.mock('../../services/firebaseService', () => ({
  firebaseService: {
    auth: {
      signIn: jest.fn(),
      currentUser: { uid: 'test123' }
    },
    firestore: {
      getDoc: jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({ name: 'Test' })
      })
    }
  }
}));
```

## Technical Questions

### How does lazy initialization work?

The Firebase service uses getter properties and initialization checks to only initialize Firebase services when they're first used:

```typescript
get auth() {
  if (!this._auth) {
    // Initialize auth only when first accessed
    this._auth = new AuthService(this.app);
  }
  return this._auth;
}
```

### How are Firebase configuration values handled?

Firebase configuration is stored in environment variables and loaded by the firebaseService. This keeps sensitive configuration out of the codebase.

### Can I use firebaseService with React Native?

Yes, the firebaseService is designed to work with both web and React Native. Import it the same way in both environments.

### Does firebaseService support offline capabilities?

Yes, it inherits all offline capabilities from Firebase. Firestore operations will work offline and sync when connectivity is restored.

## Process Questions

### How do I report issues with the Firebase service?

1. Check the [Firebase Service Documentation](../docs/firebase-service.md) first
2. Look for existing issues in GitHub
3. Create a new issue if necessary, with "Firebase Service" in the title
4. Provide a clear description of the issue and steps to reproduce

### How do I check migration progress?

Run `./scripts/firebase-migration-tracker.sh status` to see the current migration status.

### When will the migration be complete?

We're targeting [TARGET_DATE] for completion of the migration.

### How can I help with the migration?

1. Migrate your own components to use the firebaseService
2. Review PRs for Firebase migrations
3. Help with testing migrated components
4. Report any issues you find
