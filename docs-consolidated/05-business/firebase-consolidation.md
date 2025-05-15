# Firebase Consolidation Guide

## Overview

This document outlines the Firebase consolidation process for the AI Sports Edge project. We've identified multiple Firebase implementations across the codebase and consolidated them into a single, comprehensive service.

## Problem

The code duplication report identified several issues with our Firebase implementation:

1. Multiple Firebase initialization points
2. Inconsistent Firebase configuration
3. Duplicate Firebase service instances
4. Scattered Firebase utility functions

## Solution

We've created a consolidated Firebase service that follows these principles:

1. **Single Source of Truth**: One configuration file for all Firebase services
2. **Lazy Initialization**: Services are only initialized when needed
3. **Comprehensive API**: All Firebase operations are available through a single service
4. **Type Safety**: Full TypeScript support for all Firebase operations

## Implementation

The consolidated Firebase service is located at:

```
src/services/firebaseService.ts
```

This file provides:

1. Firebase app initialization
2. Access to all Firebase services (Auth, Firestore, Storage, Functions, Analytics)
3. Helper methods for common Firebase operations

## Usage

### Importing the Service

```typescript
import firebaseService from '../services/firebaseService';
```

### Authentication

```typescript
// Sign in
const signIn = async (email, password) => {
  try {
    const userCredential = await firebaseService.signIn(email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};

// Sign up
const signUp = async (email, password) => {
  try {
    const userCredential = await firebaseService.signUp(email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
};

// Sign out
const signOut = async () => {
  try {
    await firebaseService.signOut();
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

// Auth state changes
useEffect(() => {
  const unsubscribe = firebaseService.onAuthStateChange((user) => {
    setCurrentUser(user);
    setLoading(false);
  });
  
  return unsubscribe;
}, []);
```

### Firestore

```typescript
// Get a document
const getUser = async (userId) => {
  try {
    const user = await firebaseService.getDocument('users', userId);
    return user;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

// Set a document
const createUser = async (userId, userData) => {
  try {
    await firebaseService.setDocument('users', userId, userData);
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Update a document
const updateUser = async (userId, userData) => {
  try {
    await firebaseService.updateDocument('users', userId, userData);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Delete a document
const deleteUser = async (userId) => {
  try {
    await firebaseService.deleteDocument('users', userId);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};
```

### Storage

```typescript
// Upload a file
const uploadProfilePicture = async (userId, file) => {
  try {
    const downloadURL = await firebaseService.uploadFile(`users/${userId}/profile.jpg`, file);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw error;
  }
};

// Delete a file
const deleteProfilePicture = async (userId) => {
  try {
    await firebaseService.deleteFile(`users/${userId}/profile.jpg`);
  } catch (error) {
    console.error('Error deleting profile picture:', error);
    throw error;
  }
};
```

### Cloud Functions

```typescript
// Call a function
const generateAIPick = async (gameData) => {
  try {
    const result = await firebaseService.callFunction('generateAIPick', gameData);
    return result;
  } catch (error) {
    console.error('Error generating AI pick:', error);
    throw error;
  }
};
```

### Analytics

```typescript
// Log an event
const logPurchase = (purchaseData) => {
  firebaseService.logAnalyticsEvent('purchase', purchaseData);
};

// Set user properties
const setUserProperties = (user) => {
  firebaseService.setUserAnalyticsProperties({
    subscription_level: user.subscriptionLevel,
    user_type: user.type
  });
};
```

## Migration Guide

To migrate existing Firebase code to use the consolidated service:

1. Replace direct Firebase imports with the consolidated service
2. Update Firebase initialization code to use the service
3. Replace direct Firebase service calls with the service methods

### Before

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = { /* ... */ };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

const signIn = async (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

const getUser = async (userId) => {
  const docRef = doc(firestore, 'users', userId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
};
```

### After

```typescript
import firebaseService from '../services/firebaseService';

const signIn = async (email, password) => {
  return firebaseService.signIn(email, password);
};

const getUser = async (userId) => {
  return firebaseService.getDocument('users', userId);
};
```

## Benefits

1. **Reduced Code Duplication**: No more duplicate Firebase initialization
2. **Consistent Configuration**: Single source of truth for Firebase config
3. **Simplified API**: Common operations are abstracted into simple methods
4. **Better Error Handling**: Centralized error handling and logging
5. **Type Safety**: Full TypeScript support for all Firebase operations
6. **Easier Testing**: Mock the Firebase service instead of individual Firebase modules
7. **Improved Performance**: Lazy initialization of Firebase services

## Next Steps

1. Identify all Firebase usage in the codebase
2. Migrate to the consolidated service
3. Remove duplicate Firebase initialization code
4. Update tests to use the consolidated service