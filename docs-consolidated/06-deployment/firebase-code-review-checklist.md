# Firebase Code Review Checklist

Use this checklist when reviewing code that uses the Firebase service.

## Import Checking

- [ ] Uses `import { firebaseService } from '../../services/firebaseService'` instead of direct Firebase imports
- [ ] No imports from `firebase/app`, `firebase/auth`, etc.
- [ ] No duplicate imports of firebaseService

## Authentication Usage

- [ ] Uses `firebaseService.auth` for all authentication operations
- [ ] Properly handles authentication state with `onAuthStateChanged`
- [ ] Cleans up auth listeners in useEffect return functions
- [ ] Handles authentication errors appropriately
- [ ] Uses correct authentication methods (email/password, Google, etc.)

## Firestore Usage

- [ ] Uses `firebaseService.firestore` for all Firestore operations
- [ ] Uses appropriate methods for reading/writing data
- [ ] Uses server timestamps for date fields
- [ ] Handles errors in async Firestore operations
- [ ] Uses batch operations for multiple writes where appropriate
- [ ] Cleans up Firestore listeners in useEffect return functions

## Storage Usage

- [ ] Uses `firebaseService.storage` for all Storage operations
- [ ] Handles file uploads with appropriate error handling
- [ ] Uses progress callbacks for uploads where appropriate
- [ ] Properly cleans up resources

## Security Considerations

- [ ] No sensitive data exposed in client-side code
- [ ] Authentication state checked before accessing protected data
- [ ] User permissions verified when necessary
- [ ] No circumvention of security rules

## Performance Considerations

- [ ] Uses query constraints to limit data transfer
- [ ] Avoids unnecessary real-time listeners
- [ ] Uses appropriate caching strategies
- [ ] Handles offline operations where needed

## Testing

- [ ] Tests mock firebaseService appropriately
- [ ] Authentication flows are properly tested
- [ ] Data operations are verified in tests
- [ ] Error cases are handled and tested

## Accessibility and User Experience

- [ ] Authentication state changes handled gracefully in UI
- [ ] Loading states shown during Firebase operations
- [ ] Error messages are clear and actionable
- [ ] Success states are properly communicated
