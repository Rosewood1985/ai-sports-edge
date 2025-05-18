# Firebase Implementation Guide

This guide provides practical instructions for implementing and using Firebase services in the AI Sports Edge application. It covers authentication, Firestore database operations, Cloud Functions, and other Firebase services within the atomic architecture.

## Table of Contents

1. [Firebase Setup and Initialization](#firebase-setup-and-initialization)
2. [Authentication](#authentication)
3. [Firestore Database](#firestore-database)
4. [Cloud Functions](#cloud-functions)
5. [Storage](#storage)
6. [Error Handling](#error-handling)
7. [Testing Firebase Functionality](#testing-firebase-functionality)
8. [Security Best Practices](#security-best-practices)
9. [Troubleshooting](#troubleshooting)

## Firebase Setup and Initialization

### Basic Setup

To use Firebase in your components, follow these steps:

1. Import the Firebase app instance:

```javascript
// Using the atomic architecture approach (recommended)
import { getFirebaseApp } from '../atomic/atoms/firebaseApp';

// OR using the legacy approach
import { auth, db } from '../firebase';
```

2. Initialize Firebase services:

```javascript
// Using the atomic architecture approach
import { getFirebaseApp } from '../atomic/atoms/firebaseApp';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const app = getFirebaseApp();
const auth = getAuth(app);
const db = getFirestore(app);
```

### Complete Example

```javascript
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { getFirebaseApp } from '../atomic/atoms/firebaseApp';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const FirebaseComponent = () => {
  const [user, setUser] = useState(null);
  const [data, setData] = useState([]);

  useEffect(() => {
    const app = getFirebaseApp();
    const auth = getAuth(app);
    const db = getFirestore(app);

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, currentUser => {
      setUser(currentUser);
    });

    // Fetch data from Firestore
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'publicData'));
        const items = [];
        querySnapshot.forEach(doc => {
          items.push({ id: doc.id, ...doc.data() });
        });
        setData(items);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();

    // Cleanup
    return () => unsubscribe();
  }, []);

  return (
    <View>
      <Text>User: {user ? user.email : 'Not signed in'}</Text>
      <Text>Data items: {data.length}</Text>
    </View>
  );
};

export default FirebaseComponent;
```

### Environment Configuration

Firebase configuration should be loaded from environment variables:

```javascript
// In utils/envConfig.js
export const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

export const validateConfig = (config, requiredKeys) => {
  return requiredKeys.every(key => config[key] && config[key].length > 0);
};
```

## Authentication

### User Sign-In

```javascript
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirebaseApp } from '../atomic/atoms/firebaseApp';

const signIn = async (email, password) => {
  try {
    const app = getFirebaseApp();
    const auth = getAuth(app);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};
```

### User Sign-Up

```javascript
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirebaseApp } from '../atomic/atoms/firebaseApp';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const signUp = async (email, password, displayName) => {
  try {
    const app = getFirebaseApp();
    const auth = getAuth(app);
    const db = getFirestore(app);

    // Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update profile
    await updateProfile(user, { displayName });

    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email,
      displayName,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return user;
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
};
```

### User Sign-Out

```javascript
import { getAuth, signOut } from 'firebase/auth';
import { getFirebaseApp } from '../atomic/atoms/firebaseApp';

const signOutUser = async () => {
  try {
    const app = getFirebaseApp();
    const auth = getAuth(app);
    await signOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};
```

### Password Reset

```javascript
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { getFirebaseApp } from '../atomic/atoms/firebaseApp';

const resetPassword = async email => {
  try {
    const app = getFirebaseApp();
    const auth = getAuth(app);
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
};
```

### Auth State Listener

```javascript
import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirebaseApp } from '../atomic/atoms/firebaseApp';

const useAuthState = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const app = getFirebaseApp();
    const auth = getAuth(app);

    const unsubscribe = onAuthStateChanged(auth, user => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
};
```

## Firestore Database

### Reading Data

#### Get a Single Document

```javascript
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getFirebaseApp } from '../atomic/atoms/firebaseApp';

const getDocument = async (collection, id) => {
  try {
    const app = getFirebaseApp();
    const db = getFirestore(app);
    const docRef = doc(db, collection, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Error getting document ${collection}/${id}:`, error);
    throw error;
  }
};
```

#### Query Multiple Documents

```javascript
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';
import { getFirebaseApp } from '../atomic/atoms/firebaseApp';

const queryDocuments = async (collectionName, conditions = [], sortBy = null, limitTo = null) => {
  try {
    const app = getFirebaseApp();
    const db = getFirestore(app);

    let q = collection(db, collectionName);

    // Apply conditions (where clauses)
    conditions.forEach(condition => {
      q = query(q, where(condition.field, condition.operator, condition.value));
    });

    // Apply sorting
    if (sortBy) {
      q = query(q, orderBy(sortBy.field, sortBy.direction || 'asc'));
    }

    // Apply limit
    if (limitTo) {
      q = query(q, limit(limitTo));
    }

    const querySnapshot = await getDocs(q);
    const results = [];

    querySnapshot.forEach(doc => {
      results.push({ id: doc.id, ...doc.data() });
    });

    return results;
  } catch (error) {
    console.error(`Error querying ${collectionName}:`, error);
    throw error;
  }
};
```

#### Real-time Updates

```javascript
import { useEffect, useState } from 'react';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { getFirebaseApp } from '../atomic/atoms/firebaseApp';

const useDocumentListener = (collection, id) => {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const app = getFirebaseApp();
    const db = getFirestore(app);
    const docRef = doc(db, collection, id);

    const unsubscribe = onSnapshot(
      docRef,
      doc => {
        if (doc.exists()) {
          setDocument({ id: doc.id, ...doc.data() });
        } else {
          setDocument(null);
        }
        setLoading(false);
      },
      err => {
        console.error(`Error listening to ${collection}/${id}:`, err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collection, id]);

  return { document, loading, error };
};
```

### Writing Data

#### Create or Update a Document

```javascript
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseApp } from '../atomic/atoms/firebaseApp';

const setDocument = async (collection, id, data, merge = true) => {
  try {
    const app = getFirebaseApp();
    const db = getFirestore(app);

    // Add timestamps
    const dataWithTimestamps = {
      ...data,
      updatedAt: serverTimestamp(),
    };

    // Add createdAt only if creating a new document or not merging
    if (!merge) {
      dataWithTimestamps.createdAt = serverTimestamp();
    }

    await setDoc(doc(db, collection, id), dataWithTimestamps, { merge });
    return true;
  } catch (error) {
    console.error(`Error setting document ${collection}/${id}:`, error);
    throw error;
  }
};
```

#### Update Specific Fields

```javascript
import { getFirestore, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseApp } from '../atomic/atoms/firebaseApp';

const updateDocument = async (collection, id, data) => {
  try {
    const app = getFirebaseApp();
    const db = getFirestore(app);

    // Add updatedAt timestamp
    const dataWithTimestamp = {
      ...data,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(doc(db, collection, id), dataWithTimestamp);
    return true;
  } catch (error) {
    console.error(`Error updating document ${collection}/${id}:`, error);
    throw error;
  }
};
```

#### Delete a Document

```javascript
import { getFirestore, doc, deleteDoc } from 'firebase/firestore';
import { getFirebaseApp } from '../atomic/atoms/firebaseApp';

const deleteDocument = async (collection, id) => {
  try {
    const app = getFirebaseApp();
    const db = getFirestore(app);
    await deleteDoc(doc(db, collection, id));
    return true;
  } catch (error) {
    console.error(`Error deleting document ${collection}/${id}:`, error);
    throw error;
  }
};
```

#### Batch Operations

```javascript
import { getFirestore, writeBatch, doc } from 'firebase/firestore';
import { getFirebaseApp } from '../atomic/atoms/firebaseApp';

const batchUpdate = async operations => {
  try {
    const app = getFirebaseApp();
    const db = getFirestore(app);
    const batch = writeBatch(db);

    operations.forEach(op => {
      const docRef = doc(db, op.collection, op.id);

      if (op.type === 'set') {
        batch.set(docRef, op.data, { merge: op.merge !== false });
      } else if (op.type === 'update') {
        batch.update(docRef, op.data);
      } else if (op.type === 'delete') {
        batch.delete(docRef);
      }
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error in batch update:', error);
    throw error;
  }
};
```

#### Transactions

```javascript
import { getFirestore, runTransaction, doc } from 'firebase/firestore';
import { getFirebaseApp } from '../atomic/atoms/firebaseApp';

const transferPoints = async (fromUserId, toUserId, points) => {
  try {
    const app = getFirebaseApp();
    const db = getFirestore(app);

    await runTransaction(db, async transaction => {
      // Get both user documents
      const fromUserRef = doc(db, 'users', fromUserId);
      const toUserRef = doc(db, 'users', toUserId);

      const fromUserDoc = await transaction.get(fromUserRef);
      const toUserDoc = await transaction.get(toUserRef);

      if (!fromUserDoc.exists() || !toUserDoc.exists()) {
        throw new Error('One or both users do not exist');
      }

      const fromUserPoints = fromUserDoc.data().points || 0;
      const toUserPoints = toUserDoc.data().points || 0;

      if (fromUserPoints < points) {
        throw new Error('Insufficient points');
      }

      // Update both documents
      transaction.update(fromUserRef, {
        points: fromUserPoints - points,
        updatedAt: new Date(),
      });

      transaction.update(toUserRef, {
        points: toUserPoints + points,
        updatedAt: new Date(),
      });
    });

    return true;
  } catch (error) {
    console.error('Error in transaction:', error);
    throw error;
  }
};
```

## Cloud Functions

### Calling Cloud Functions

```javascript
import { getFirebaseApp } from '../atomic/atoms/firebaseApp';
import { getFunctions, httpsCallable } from 'firebase/functions';

const callFunction = async (functionName, data) => {
  try {
    const app = getFirebaseApp();
    const functions = getFunctions(app);
    const functionRef = httpsCallable(functions, functionName);

    const result = await functionRef(data);
    return result.data;
  } catch (error) {
    console.error(`Error calling function ${functionName}:`, error);
    throw error;
  }
};
```

### Example: Calling a Function

```javascript
const processPayment = async paymentData => {
  try {
    const result = await callFunction('processPayment', paymentData);
    return result;
  } catch (error) {
    console.error('Payment processing error:', error);
    throw error;
  }
};
```

### Database Consistency Triggers

The application uses Cloud Functions to maintain data consistency between collections. These triggers are defined in `functions/database-consistency-triggers.js` and include:

1. `syncSubscriptionStatus`: Syncs subscription status from subscriptions subcollection to users collection
2. `syncCustomerId`: Syncs customer ID changes from users collection to subscriptions subcollection
3. `standardizeStatusSpelling`: Standardizes "canceled"/"cancelled" spelling across collections

To deploy these triggers:

```bash
./deploy-database-consistency-triggers.sh
```

To test these triggers:

```bash
node test-triggers.js
```

## Storage

### Uploading Files

```javascript
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirebaseApp } from '../atomic/atoms/firebaseApp';

const uploadFile = async (file, path) => {
  try {
    const app = getFirebaseApp();
    const storage = getStorage(app);
    const storageRef = ref(storage, path);

    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return {
      path,
      downloadURL,
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};
```

### Downloading Files

```javascript
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { getFirebaseApp } from '../atomic/atoms/firebaseApp';

const getFileURL = async path => {
  try {
    const app = getFirebaseApp();
    const storage = getStorage(app);
    const fileRef = ref(storage, path);

    const url = await getDownloadURL(fileRef);
    return url;
  } catch (error) {
    console.error('Error getting file URL:', error);
    throw error;
  }
};
```

### Deleting Files

```javascript
import { getStorage, ref, deleteObject } from 'firebase/storage';
import { getFirebaseApp } from '../atomic/atoms/firebaseApp';

const deleteFile = async path => {
  try {
    const app = getFirebaseApp();
    const storage = getStorage(app);
    const fileRef = ref(storage, path);

    await deleteObject(fileRef);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};
```

## Error Handling

### Common Firebase Errors

```javascript
const handleFirebaseError = error => {
  // Authentication errors
  if (error.code?.startsWith('auth/')) {
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Invalid email or password';
      case 'auth/email-already-in-use':
        return 'Email is already in use';
      case 'auth/weak-password':
        return 'Password is too weak';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/account-exists-with-different-credential':
        return 'An account already exists with the same email address but different sign-in credentials';
      case 'auth/operation-not-allowed':
        return 'This operation is not allowed';
      case 'auth/too-many-requests':
        return 'Too many unsuccessful login attempts. Please try again later';
      case 'auth/api-key-not-valid':
        return 'Firebase API key is invalid. Please check your environment configuration';
      default:
        return `Authentication error: ${error.message}`;
    }
  }

  // Firestore errors
  if (error.code?.startsWith('firestore/')) {
    switch (error.code) {
      case 'firestore/permission-denied':
        return 'You do not have permission to access this data';
      case 'firestore/not-found':
        return 'The requested document was not found';
      case 'firestore/already-exists':
        return 'The document already exists';
      case 'firestore/failed-precondition':
        return 'Operation failed due to a precondition failure';
      case 'firestore/aborted':
        return 'The operation was aborted';
      case 'firestore/data-loss':
        return 'Unrecoverable data loss or corruption';
      default:
        return `Database error: ${error.message}`;
    }
  }

  // Storage errors
  if (error.code?.startsWith('storage/')) {
    switch (error.code) {
      case 'storage/object-not-found':
        return 'File not found';
      case 'storage/unauthorized':
        return 'You do not have permission to access this file';
      case 'storage/canceled':
        return 'Operation canceled';
      case 'storage/quota-exceeded':
        return 'Storage quota exceeded';
      default:
        return `Storage error: ${error.message}`;
    }
  }

  // Functions errors
  if (error.code?.startsWith('functions/')) {
    switch (error.code) {
      case 'functions/invalid-argument':
        return 'Invalid argument provided to function';
      case 'functions/deadline-exceeded':
        return 'Function execution took too long';
      case 'functions/not-found':
        return 'Function not found';
      case 'functions/permission-denied':
        return 'You do not have permission to call this function';
      case 'functions/resource-exhausted':
        return 'Resource quota exceeded';
      case 'functions/failed-precondition':
        return 'Function execution failed due to a precondition failure';
      default:
        return `Function error: ${error.message}`;
    }
  }

  // Generic error
  return error.message || 'An unknown error occurred';
};
```

### Error Boundary Component

```jsx
import React, { Component } from 'react';
import { View, Text, Button } from 'react-native';

class FirebaseErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error
    console.error('Firebase error caught:', error, errorInfo);

    // You could also send this to a logging service
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = handleFirebaseError(this.state.error);

      return (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
            Something went wrong
          </Text>
          <Text style={{ marginBottom: 20 }}>{errorMessage}</Text>
          <Button title="Try Again" onPress={this.resetError} />
        </View>
      );
    }

    return this.props.children;
  }
}

export default FirebaseErrorBoundary;
```

## Testing Firebase Functionality

### Setting Up Firebase Emulators

```javascript
import { getFirebaseApp } from '../atomic/atoms/firebaseApp';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const connectToEmulators = () => {
  if (process.env.NODE_ENV === 'development' || process.env.USE_FIREBASE_EMULATORS) {
    const app = getFirebaseApp();

    // Auth emulator
    const auth = getAuth(app);
    connectAuthEmulator(auth, 'http://localhost:9099');

    // Firestore emulator
    const db = getFirestore(app);
    connectFirestoreEmulator(db, 'localhost', 8080);

    // Functions emulator
    const functions = getFunctions(app);
    connectFunctionsEmulator(functions, 'localhost', 5001);

    // Storage emulator
    const storage = getStorage(app);
    connectStorageEmulator(storage, 'localhost', 9199);

    console.log('Connected to Firebase emulators');
  }
};
```

### Unit Testing with Jest

```javascript
// __tests__/firebase.test.js
import { getFirebaseApp } from '../atomic/atoms/firebaseApp';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// Mock Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: null,
  })),
  signInWithEmailAndPassword: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn(),
  getDoc: jest.fn(),
}));

describe('Firebase Authentication', () => {
  test('signInWithEmailAndPassword calls Firebase auth', async () => {
    // Setup
    const mockUserCredential = {
      user: { uid: '123', email: 'test@example.com' },
    };
    signInWithEmailAndPassword.mockResolvedValueOnce(mockUserCredential);

    // Execute
    const app = getFirebaseApp();
    const auth = getAuth(app);
    const result = await signInWithEmailAndPassword(auth, 'test@example.com', 'password');

    // Verify
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(auth, 'test@example.com', 'password');
    expect(result).toEqual(mockUserCredential);
  });
});
```

## Security Best Practices

### Firestore Security Rules

The application uses Firestore security rules to secure the database. These rules are defined in `firestore.rules` and include:

1. Authentication checks
2. User-specific data access control
3. Role-based access control
4. Data validation
5. Rate limiting

Key security functions:

```javascript
// Function to check if the user is authenticated
function isAuthenticated() {
  return request.auth != null;
}

// Function to check if the user is accessing their own data
function isUser(userId) {
  return isAuthenticated() && request.auth.uid == userId;
}

// Function to check if the user is an admin
function isAdmin() {
  return isAuthenticated() &&
    exists(/databases/$(database)/documents/admins/$(request.auth.uid));
}

// Function to validate timestamp fields
function hasValidTimestamps() {
  let requiredFields = ['createdAt', 'updatedAt'];
  let allFieldsExist = requiredFields.hasAll(request.resource.data.keys());
  let createdAtValid = request.resource.data.createdAt is timestamp;
  let updatedAtValid = request.resource.data.updatedAt is timestamp;

  return allFieldsExist && createdAtValid && updatedAtValid;
}
```

### Storage Security Rules

Storage security rules protect files stored in Firebase Storage:

```javascript
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

### API Key Protection

To protect Firebase API keys:

1. Use environment variables for all Firebase configuration
2. Validate configuration before initializing Firebase
3. Implement proper error handling for API key issues
4. Use Firebase App Check for additional security

## Troubleshooting

### Authentication Issues

1. **User can't sign in**

   - Check if the email and password are correct
   - Verify that the user account exists
   - Check for account disabled status
   - Look for too many failed login attempts

2. **API key not valid**
   - Ensure environment variables are properly set
   - Verify that the API key is valid and not restricted
   - Check if the Firebase project is properly configured

### Firestore Issues

1. **Permission denied**

   - Check Firestore security rules
   - Verify that the user is authenticated
   - Ensure the user has the necessary permissions

2. **Missing or invalid data**
   - Check the document path
   - Verify that the document exists
   - Ensure data is properly formatted

### Cloud Functions Issues

1. **Function not executing**

   - Check function deployment status
   - Verify function triggers
   - Look for errors in function logs

2. **Function timing out**
   - Optimize function code
   - Consider increasing function timeout
   - Break down complex operations

### Debugging Firebase Issues

1. **Enable verbose logging**

```javascript
import { getFirebaseApp } from '../atomic/atoms/firebaseApp';
import { getFirestore, setLogLevel } from 'firebase/firestore';

// Enable verbose logging in development
if (process.env.NODE_ENV === 'development') {
  const app = getFirebaseApp();
  const db = getFirestore(app);
  setLogLevel('debug');
}
```

2. **Check Firebase console**

   - Review Authentication logs
   - Check Firestore usage and errors
   - Monitor Cloud Functions logs
   - Examine Storage activity

3. **Use Firebase local emulators for testing**
   - Run `firebase emulators:start` to start local emulators
   - Connect your app to the emulators for testing
   - Examine emulator logs for detailed error information
