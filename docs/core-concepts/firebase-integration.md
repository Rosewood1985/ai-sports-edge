# Firebase Integration

## Overview

AI Sports Edge uses Firebase as its primary backend service, providing authentication, database, storage, and cloud functions. This document provides an overview of how Firebase is integrated into the application using the atomic architecture.

## Firebase Services Used

- **Authentication**: User authentication and management
- **Firestore**: NoSQL database for storing application data
- **Storage**: File storage for user uploads and application assets
- **Cloud Functions**: Serverless functions for backend logic
- **Cloud Messaging**: Push notifications
- **Analytics**: User behavior tracking
- **Crashlytics**: Crash reporting

## Architecture

The Firebase integration follows the atomic architecture pattern:

- **Atoms**: Basic Firebase initialization and configuration
- **Molecules**: Individual Firebase service wrappers
- **Organisms**: Integrated Firebase service that combines all Firebase functionality

### Atoms

- `firebaseApp.js`: Initializes the Firebase app
- `firebaseConfig.js`: Contains Firebase configuration
- `firebaseUtils.js`: Utility functions for Firebase

### Molecules

- `firebaseAuth.js`: Authentication functionality
- `firebaseFirestore.js`: Database operations
- `firebaseStorage.js`: Storage operations
- `firebaseMessaging.js`: Push notification functionality
- `firebaseAnalytics.js`: Analytics tracking
- `firebaseCrashlytics.js`: Crash reporting

### Organisms

- `firebaseService.js`: Integrated Firebase service that combines all Firebase functionality

## Implementation

### Firebase Initialization

```javascript
// atoms/firebaseApp.js
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/storage';
import 'firebase/functions';
import 'firebase/messaging';
import 'firebase/analytics';
import 'firebase/crashlytics';
import { firebaseConfig } from './firebaseConfig';

let app;

export const initializeFirebaseApp = () => {
  if (!firebase.apps.length) {
    app = firebase.initializeApp(firebaseConfig);
  } else {
    app = firebase.app();
  }
  return app;
};

export const getFirebaseApp = () => {
  if (!app) {
    return initializeFirebaseApp();
  }
  return app;
};

export default getFirebaseApp();
```

### Firebase Authentication

```javascript
// molecules/firebaseAuth.js
import firebase from 'firebase/app';
import 'firebase/auth';
import firebaseApp from '../atoms/firebaseApp';

const auth = firebase.auth(firebaseApp);

export const signInWithEmailAndPassword = async (email, password) => {
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    return userCredential;
  } catch (error) {
    throw error;
  }
};

export const signOut = async () => {
  try {
    await auth.signOut();
  } catch (error) {
    throw error;
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const onAuthStateChanged = callback => {
  return auth.onAuthStateChanged(callback);
};

export default {
  signInWithEmailAndPassword,
  signOut,
  getCurrentUser,
  onAuthStateChanged,
};
```

### Firebase Firestore

```javascript
// molecules/firebaseFirestore.js
import firebase from 'firebase/app';
import 'firebase/firestore';
import firebaseApp from '../atoms/firebaseApp';

const firestore = firebase.firestore(firebaseApp);

export const getDocument = async (collection, id) => {
  try {
    const doc = await firestore.collection(collection).doc(id).get();
    if (doc.exists) {
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    throw error;
  }
};

export const setDocument = async (collection, id, data) => {
  try {
    await firestore.collection(collection).doc(id).set(data, { merge: true });
  } catch (error) {
    throw error;
  }
};

export const queryDocuments = async (collection, queryFn) => {
  try {
    let query = firestore.collection(collection);
    if (queryFn) {
      query = queryFn(query);
    }
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw error;
  }
};

export default {
  getDocument,
  setDocument,
  queryDocuments,
};
```

### Integrated Firebase Service

```javascript
// organisms/firebaseService.js
import firebaseApp, { initializeFirebaseApp } from '../atoms/firebaseApp';
import auth from '../molecules/firebaseAuth';
import firestore from '../molecules/firebaseFirestore';
import storage from '../molecules/firebaseStorage';
import messaging from '../molecules/firebaseMessaging';
import analytics from '../molecules/firebaseAnalytics';
import crashlytics from '../molecules/firebaseCrashlytics';

export const initialize = () => {
  try {
    initializeFirebaseApp();
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};

export default {
  initialize,
  app: firebaseApp,
  auth,
  firestore,
  storage,
  messaging,
  analytics,
  crashlytics,
};
```

## Usage Examples

### Authentication

```javascript
import { firebaseService } from '../atomic/organisms';

// Sign in
const signIn = async (email, password) => {
  try {
    const userCredential = await firebaseService.auth.signInWithEmailAndPassword(email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};

// Sign out
const signOut = async () => {
  try {
    await firebaseService.auth.signOut();
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

// Get current user
const getCurrentUser = () => {
  return firebaseService.auth.getCurrentUser();
};

// Listen for auth state changes
const listenForAuthChanges = callback => {
  return firebaseService.auth.onAuthStateChanged(callback);
};
```

### Firestore

```javascript
import { firebaseService } from '../atomic/organisms';

// Get document
const getUserData = async userId => {
  try {
    const userData = await firebaseService.firestore.getDocument('users', userId);
    return userData;
  } catch (error) {
    console.error('Get user data error:', error);
    throw error;
  }
};

// Set document
const updateUserData = async (userId, data) => {
  try {
    await firebaseService.firestore.setDocument('users', userId, data);
  } catch (error) {
    console.error('Update user data error:', error);
    throw error;
  }
};

// Query documents
const getActiveUsers = async () => {
  try {
    const users = await firebaseService.firestore.queryDocuments('users', query =>
      query.where('status', '==', 'active')
    );
    return users;
  } catch (error) {
    console.error('Get active users error:', error);
    throw error;
  }
};
```

## Security Rules

Firebase security rules are used to secure the database and storage:

```javascript
// Firestore security rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /public/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}

// Storage security rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /public/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Cloud Functions

Cloud Functions are used for server-side logic:

```javascript
// Example Cloud Function
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.syncSubscriptionStatus = functions.firestore
  .document('subscriptions/{subscriptionId}')
  .onWrite(async (change, context) => {
    const subscriptionData = change.after.exists ? change.after.data() : null;
    if (!subscriptionData) return null;

    const userId = subscriptionData.userId;
    if (!userId) return null;

    const userRef = admin.firestore().collection('users').doc(userId);

    return userRef.update({
      subscriptionStatus: subscriptionData.status,
      subscriptionExpiration: subscriptionData.expirationDate,
      subscriptionTier: subscriptionData.tier,
    });
  });
```

## Best Practices

1. **Use the Firebase Service**: Always use the Firebase service from the atomic architecture instead of directly using Firebase
2. **Error Handling**: Always handle errors from Firebase operations
3. **Offline Support**: Configure Firestore for offline support
4. **Security Rules**: Keep security rules up to date
5. **Batch Operations**: Use batch operations for multiple writes
6. **Transactions**: Use transactions for operations that need to be atomic
7. **Indexing**: Create indexes for complex queries
8. **Data Structure**: Design the data structure for efficient queries

## Related Documentation

- [Firebase Authentication Guide](../implementation-guides/firebase-authentication-guide.md)
- [Firestore Data Modeling](../implementation-guides/firestore-data-modeling.md)
- [Cloud Functions Guide](../implementation-guides/cloud-functions-guide.md)
