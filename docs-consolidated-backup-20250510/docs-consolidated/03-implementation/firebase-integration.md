# Firebase SDK Integration

This document provides an overview of the Firebase SDK integration in the AI Sports Edge app.

## Overview

The app uses Firebase for several key features:
- Authentication (user sign-in, sign-up)
- Firestore database (storing user data, FAQs, etc.)
- Cloud Functions (serverless backend operations)

## Firebase Configuration

### Core Configuration

The Firebase configuration is located in `config/firebase.ts`. This file initializes the Firebase app and exports the necessary services:

```typescript
import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Initialize Firebase if it hasn't been initialized yet
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Get the auth instance
const authInstance = auth();
const firestoreInstance = firestore();

// Export the Firebase services
export { firebase };
export { authInstance as auth };
export { firestoreInstance as firestore };
```

### Platform-Specific Configuration

The app includes platform-specific configuration files:

- **iOS**: `firebase-config/GoogleService-Info.plist`
- **Android**: `firebase-config/google-services.json`

These files are referenced in `app.json` to ensure they're included in the build:

```json
"ios": {
  "supportsTablet": true,
  "bundleIdentifier": "com.aisportsedge.app",
  "googleServicesFile": "./firebase-config/GoogleService-Info.plist"
},
"android": {
  "adaptiveIcon": {
    "foregroundImage": "./assets/images/adaptive-icon.png",
    "backgroundColor": "#ffffff"
  },
  "package": "com.aisportsedge.app",
  "googleServicesFile": "./firebase-config/google-services.json"
}
```

## Firebase Packages

The app uses the following Firebase packages:

- `@react-native-firebase/app`: Core Firebase functionality
- `@react-native-firebase/auth`: Authentication services
- `@react-native-firebase/firestore`: Firestore database
- `@react-native-firebase/functions`: Cloud Functions

## Usage Examples

### Authentication

```typescript
import { auth } from '../config/firebase';

// Sign in with email and password
const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};

// Sign out
const signOut = async () => {
  try {
    await auth.signOut();
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

// Get current user
const getCurrentUser = () => {
  return auth.currentUser;
};
```

### Firestore

```typescript
import { firestore } from '../config/firebase';

// Read data
const getDocument = async (collection: string, docId: string) => {
  try {
    const docRef = firestore.collection(collection).doc(docId);
    const doc = await docRef.get();
    
    if (doc.exists) {
      return doc.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting document:', error);
    throw error;
  }
};

// Write data
const setDocument = async (collection: string, docId: string, data: any) => {
  try {
    await firestore.collection(collection).doc(docId).set(data);
  } catch (error) {
    console.error('Error setting document:', error);
    throw error;
  }
};

// Update data
const updateDocument = async (collection: string, docId: string, data: any) => {
  try {
    await firestore.collection(collection).doc(docId).update(data);
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
};
```

## Testing Firebase Integration

A utility for testing the Firebase integration is available in `utils/firebaseTest.ts`. This utility provides functions to test authentication and Firestore connections:

```typescript
import { testFirebase } from '../utils/firebaseTest';

// Test Firebase integration
const testConnection = async () => {
  try {
    await testFirebase();
    console.log('Firebase integration is working correctly');
  } catch (error) {
    console.error('Firebase integration test failed:', error);
  }
};
```

## Troubleshooting

### Common Issues

1. **Authentication Errors**:
   - Check if the user is signed in before accessing `auth.currentUser`
   - Ensure email and password meet Firebase requirements

2. **Firestore Errors**:
   - Verify security rules allow the operation
   - Check network connectivity
   - Ensure the collection/document path is correct

3. **Configuration Issues**:
   - Verify the Firebase configuration matches your Firebase project
   - Ensure platform-specific files are correctly referenced in app.json

### Debugging

For debugging Firebase issues:

1. Enable verbose logging:
   ```typescript
   import { firebase } from '@react-native-firebase/app';
   firebase.app().setLogLevel('debug');
   ```

2. Check Firebase console for errors:
   - Authentication issues in the Authentication section
   - Database errors in the Firestore section
   - Function errors in the Functions section

## Security Considerations

1. **API Keys**: The Firebase configuration contains API keys. These are safe to include in your app as they are restricted by Firebase security rules and API restrictions.

2. **Security Rules**: Ensure Firestore security rules are properly configured to restrict access to data.

3. **Authentication**: Implement proper authentication flows and validation.

## Performance Optimization

1. **Offline Support**: Configure Firestore for offline support:
   ```typescript
   import { firestore } from '../config/firebase';
   firestore.settings({
     cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED
   });
   firestore.enablePersistence();
   ```

2. **Batch Operations**: Use batch operations for multiple writes:
   ```typescript
   const batch = firestore.batch();
   // Add operations to batch
   await batch.commit();
   ```

3. **Query Optimization**: Limit query results and use indexes:
   ```typescript
   const query = firestore.collection('items').limit(20);