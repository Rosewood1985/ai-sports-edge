# Firebase Integration

This directory contains the Firebase configuration and service modules for AI Sports Edge.

## Structure

- `config.js` - Core Firebase initialization and configuration
- `auth.js` - Authentication methods (sign up, sign in, etc.)
- `firestore.js` - Firestore database operations
- `index.js` - Unified export interface

## Usage

### Basic Import

```javascript
// Import all Firebase services
import * as firebase from '../firebase';

// Use Firebase services
firebase.auth.signIn(email, password);
firebase.createDocument('users', userData);
```

### Specific Imports

```javascript
// Import specific Firebase services
import { auth, firestore } from '../firebase';
import { signIn, createUser } from '../firebase/auth';
import { createDocument, queryDocuments } from '../firebase/firestore';

// Use authentication
const result = await signIn(email, password);

// Use Firestore
const { documents } = await queryDocuments('users', [
  { field: 'active', operator: '==', value: true }
]);
```

## Authentication Methods

- `createUser(email, password)` - Create a new user account
- `signIn(email, password)` - Sign in with email and password
- `signInWithGoogle()` - Sign in with Google
- `logOut()` - Sign out the current user
- `resetPassword(email)` - Send password reset email
- `getCurrentUser()` - Get the current user object
- `onAuthChange(callback)` - Subscribe to auth state changes

## Firestore Methods

- `createDocument(collection, data)` - Create a document with auto-generated ID
- `createDocumentWithId(collection, id, data)` - Create a document with specific ID
- `getDocument(collection, id)` - Get a document by ID
- `updateDocument(collection, id, data)` - Update a document
- `deleteDocument(collection, id)` - Delete a document
- `queryDocuments(collection, conditions, orderBy, limit, startAfter)` - Query documents
- `subscribeToDocument(collection, id, callback)` - Real-time document updates
- `subscribeToQuery(collection, conditions, orderBy, limit, callback)` - Real-time query updates

## Error Handling

All methods return objects with consistent error handling:

```javascript
// Authentication result example
{
  user: userObject, // null if error
  error: errorObject // null if success
}

// Firestore result example
{
  documents: [...], // empty array if error
  count: 0, // number of documents
  error: errorObject // null if success
}
```

## Environment Variables

The Firebase configuration uses environment variables when available:

- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_MEASUREMENT_ID`

If environment variables are not set, it falls back to the hardcoded values in `config.js`.