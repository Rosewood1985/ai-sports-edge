# Atomic Architecture for AI Sports Edge

This directory contains the atomic architecture implementation for the AI Sports Edge app. The architecture follows the atomic design principles, organizing code into atoms, molecules, and organisms.

## Structure

```
/atomic
  /atoms        - Basic building blocks
  /molecules    - Combinations of atoms
  /organisms    - Complex components combining molecules
  index.ts      - Main entry point
```

## Firebase Services

The Firebase services have been refactored to follow atomic architecture principles:

### Atoms

- `firebaseApp.ts` - Initializes the Firebase app with configuration

### Molecules

- `firebaseAuth.ts` - Authentication services
- `firebaseFirestore.ts` - Firestore database services
- `firebaseStorage.ts` - Storage services
- `firebaseFunctions.ts` - Cloud Functions services
- `firebaseAnalytics.ts` - Analytics services

### Organisms

- `firebaseService.ts` - Consolidated service that combines all Firebase molecules

## Usage

### Import the Firebase Service

```typescript
// Import the entire service
import { firebaseService } from 'src/atomic';

// Or import specific parts
import { firebaseAuth, firebaseFirestore } from 'src/atomic/molecules';
```

### Authentication

```typescript
// Sign in
const signIn = async (email, password) => {
  try {
    const userCredential = await firebaseService.auth.signIn(email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};

// Sign out
const signOut = async () => {
  await firebaseService.auth.signOut();
};

// Listen to auth state changes
const unsubscribe = firebaseService.auth.onAuthStateChange((user) => {
  if (user) {
    console.log('User is signed in:', user.uid);
  } else {
    console.log('User is signed out');
  }
});
```

### Firestore

```typescript
// Get a document
const getUser = async (userId) => {
  const user = await firebaseService.firestore.getDocument('users', userId);
  return user;
};

// Set a document
const createUser = async (userId, userData) => {
  await firebaseService.firestore.setDocument('users', userId, userData);
};

// Update a document
const updateUser = async (userId, userData) => {
  await firebaseService.firestore.updateDocument('users', userId, userData);
};

// Subscribe to a document
const unsubscribe = firebaseService.firestore.subscribeToDocument(
  'users',
  userId,
  (user) => {
    console.log('User updated:', user);
  }
);
```

### Storage

```typescript
// Upload a file
const uploadProfilePicture = async (userId, file) => {
  const downloadURL = await firebaseService.storage.uploadFile(
    `users/${userId}/profile.jpg`,
    file
  );
  return downloadURL;
};

// Delete a file
const deleteProfilePicture = async (userId) => {
  await firebaseService.storage.deleteFile(`users/${userId}/profile.jpg`);
};
```

### Cloud Functions

```typescript
// Call a function
const processPayment = async (paymentData) => {
  const result = await firebaseService.functions.callFunction(
    'processPayment',
    paymentData
  );
  return result;
};
```

### Analytics

```typescript
// Log an event
firebaseService.analytics.logEvent(
  firebaseService.analytics.events.PLACE_BET,
  {
    betAmount: 100,
    gameId: 'game123',
    odds: 2.5
  }
);

// Set user properties
firebaseService.analytics.setUserProperties({
  userTier: 'premium',
  betPreference: 'football'
});
```

## Benefits

- **Modularity**: Each component has a single responsibility
- **Testability**: Easy to mock and test individual components
- **Maintainability**: Clear structure and organization
- **Scalability**: Easy to add new features and functionality