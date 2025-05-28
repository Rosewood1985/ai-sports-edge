# Firebase Migration Testing Plan

This document outlines the testing strategy to validate the Firebase migration implementation following atomic architecture principles.

## 1. Unit Testing

### Atoms Testing

1. **Environment Variable Atom**

   ```typescript
   import { getEnvVar, getEnvironment } from '../../src/atoms/env/environmentAtom';

   describe('Environment Variable Atom', () => {
     beforeEach(() => {
       // Reset environment variables before each test
       process.env = {};
     });

     test('getEnvVar returns environment variable when present', () => {
       process.env.TEST_VAR = 'test-value';
       expect(getEnvVar('TEST_VAR')).toBe('test-value');
     });

     test('getEnvVar returns default value when variable not present', () => {
       expect(getEnvVar('MISSING_VAR', 'default-value')).toBe('default-value');
     });

     test('getEnvironment returns correct environment', () => {
       process.env.NODE_ENV = 'production';
       expect(getEnvironment()).toBe('production');

       process.env.NODE_ENV = 'staging';
       expect(getEnvironment()).toBe('staging');

       process.env.NODE_ENV = 'development';
       expect(getEnvironment()).toBe('development');

       process.env.NODE_ENV = 'anything-else';
       expect(getEnvironment()).toBe('development'); // Default
     });
   });
   ```

2. **Firebase Config Atom**

   ```typescript
   import {
     getFirebaseConfig,
     getDefaultFirebaseConfig,
   } from '../../src/atoms/firebase/firebaseConfig';

   describe('Firebase Config Atom', () => {
     beforeEach(() => {
       // Reset environment variables before each test
       process.env = {};
     });

     test('getFirebaseConfig returns production config when environment is production', () => {
       const config = getFirebaseConfig('production');
       expect(config.production).toBe(true);
       expect(config.projectId).toBe('ai-sports-edge-prod');
     });

     test('getFirebaseConfig returns staging config when environment is staging', () => {
       const config = getFirebaseConfig('staging');
       expect(config.production).toBe(false);
       expect(config.projectId).toBe('ai-sports-edge-staging');
     });

     test('getFirebaseConfig returns development config when environment is development', () => {
       const config = getFirebaseConfig('development');
       expect(config.production).toBe(false);
       expect(config.projectId).toBe('ai-sports-edge-dev');
     });

     test('getDefaultFirebaseConfig uses NODE_ENV to determine environment', () => {
       process.env.NODE_ENV = 'production';
       expect(getDefaultFirebaseConfig().production).toBe(true);

       process.env.NODE_ENV = 'development';
       expect(getDefaultFirebaseConfig().production).toBe(false);
     });
   });
   ```

3. **Error Handler Atom**

   ```typescript
   import {
     createErrorDetail,
     logError,
     formatAuthError,
   } from '../../src/atoms/error/errorHandlerAtom';

   describe('Error Handler Atom', () => {
     beforeEach(() => {
       // Spy on console.error
       jest.spyOn(console, 'error').mockImplementation();
     });

     afterEach(() => {
       // Restore console.error
       jest.restoreAllMocks();
     });

     test('createErrorDetail creates proper error detail object', () => {
       const error = createErrorDetail('test-code', 'test-message', { foo: 'bar' });
       expect(error.code).toBe('test-code');
       expect(error.message).toBe('test-message');
       expect(error.context).toEqual({ foo: 'bar' });
       expect(error.timestamp).toBeDefined();
     });

     test('logError logs error to console', () => {
       const error = createErrorDetail('test-code', 'test-message');
       logError(error);
       expect(console.error).toHaveBeenCalled();
     });

     test('formatAuthError formats Firebase auth errors', () => {
       const authError = { code: 'auth/user-not-found', message: 'User not found' };
       const formattedError = formatAuthError(authError);
       expect(formattedError.code).toBe('auth/user-not-found');
       expect(formattedError.message).toBe('User not found');
       expect(formattedError.context).toBeDefined();
     });

     test('formatAuthError handles undefined error code', () => {
       const authError = { message: 'Generic error' };
       const formattedError = formatAuthError(authError);
       expect(formattedError.code).toBe('auth/unknown');
     });
   });
   ```

### Molecules Testing

1. **Firebase App Molecule**

   ```typescript
   import { initializeFirebaseApp, getFirebaseApp } from '../../src/molecules/firebase/firebaseApp';
   import { getDefaultFirebaseConfig } from '../../src/atoms/firebase/firebaseConfig';
   import { initializeApp } from 'firebase/app';

   // Mock Firebase
   jest.mock('firebase/app', () => ({
     initializeApp: jest.fn().mockReturnValue({ name: 'mock-app' }),
   }));

   describe('Firebase App Molecule', () => {
     beforeEach(() => {
       // Clear mocks before each test
       jest.clearAllMocks();
     });

     test('initializeFirebaseApp initializes app with config', () => {
       const config = getDefaultFirebaseConfig();
       const app = initializeFirebaseApp(config);

       expect(initializeApp).toHaveBeenCalledWith(config);
       expect(app).toEqual({ name: 'mock-app' });
     });

     test('getFirebaseApp returns existing app instance if already initialized', () => {
       const app1 = initializeFirebaseApp();
       const app2 = getFirebaseApp();

       expect(initializeApp).toHaveBeenCalledTimes(1);
       expect(app1).toEqual(app2);
     });

     test('getFirebaseApp initializes app if not already initialized', () => {
       const app = getFirebaseApp();

       expect(initializeApp).toHaveBeenCalledTimes(1);
       expect(app).toEqual({ name: 'mock-app' });
     });
   });
   ```

2. **Firebase Auth Molecule**

   ```typescript
   import {
     getFirebaseAuth,
     signInUser,
     createUser,
     updateUserProfile,
     resetPassword,
   } from '../../src/molecules/firebase/firebaseAuth';
   import { getFirebaseApp } from '../../src/molecules/firebase/firebaseApp';
   import {
     getAuth,
     signInWithEmailAndPassword,
     createUserWithEmailAndPassword,
     updateProfile,
     sendPasswordResetEmail,
   } from 'firebase/auth';

   // Mock Firebase
   jest.mock('../../src/molecules/firebase/firebaseApp', () => ({
     getFirebaseApp: jest.fn().mockReturnValue({ name: 'mock-app' }),
   }));

   jest.mock('firebase/auth', () => ({
     getAuth: jest.fn().mockReturnValue({ name: 'mock-auth' }),
     signInWithEmailAndPassword: jest.fn(),
     createUserWithEmailAndPassword: jest.fn(),
     updateProfile: jest.fn(),
     sendPasswordResetEmail: jest.fn(),
     sendEmailVerification: jest.fn(),
   }));

   describe('Firebase Auth Molecule', () => {
     beforeEach(() => {
       // Clear mocks before each test
       jest.clearAllMocks();
     });

     test('getFirebaseAuth initializes auth with app', () => {
       const auth = getFirebaseAuth();

       expect(getFirebaseApp).toHaveBeenCalled();
       expect(getAuth).toHaveBeenCalledWith({ name: 'mock-app' });
       expect(auth).toEqual({ name: 'mock-auth' });
     });

     test('signInUser calls signInWithEmailAndPassword', async () => {
       const mockCredential = { user: { uid: '123' } };
       signInWithEmailAndPassword.mockResolvedValue(mockCredential);

       const result = await signInUser('test@example.com', 'password');

       expect(getFirebaseAuth).toHaveBeenCalled();
       expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
         { name: 'mock-auth' },
         'test@example.com',
         'password'
       );
       expect(result).toEqual(mockCredential);
     });

     test('createUser calls createUserWithEmailAndPassword', async () => {
       const mockCredential = { user: { uid: '123', sendEmailVerification: jest.fn() } };
       createUserWithEmailAndPassword.mockResolvedValue(mockCredential);

       const result = await createUser('test@example.com', 'password');

       expect(getFirebaseAuth).toHaveBeenCalled();
       expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
         { name: 'mock-auth' },
         'test@example.com',
         'password'
       );
       expect(result).toEqual(mockCredential);
     });
   });
   ```

### Organisms Testing

1. **Firebase Service Organism**

   ```typescript
   import firebaseService from '../../src/organisms/firebase/firebaseService';
   import { getFirebaseApp } from '../../src/molecules/firebase/firebaseApp';
   import { signInUser, createUser } from '../../src/molecules/firebase/firebaseAuth';
   import { setDocument, getDocument } from '../../src/molecules/firebase/firebaseFirestore';
   import { callFunction } from '../../src/molecules/firebase/firebaseFunctions';

   // Mock Firebase molecules
   jest.mock('../../src/molecules/firebase/firebaseApp');
   jest.mock('../../src/molecules/firebase/firebaseAuth');
   jest.mock('../../src/molecules/firebase/firebaseFirestore');
   jest.mock('../../src/molecules/firebase/firebaseFunctions');

   describe('Firebase Service Organism', () => {
     beforeEach(() => {
       // Clear mocks before each test
       jest.clearAllMocks();
     });

     test('initializeApp calls getFirebaseApp', () => {
       firebaseService.initializeApp();
       expect(getFirebaseApp).toHaveBeenCalled();
     });

     test('signIn calls signInUser with correct parameters', async () => {
       const mockUser = { uid: '123' };
       (signInUser as jest.Mock).mockResolvedValue({ user: mockUser });

       const result = await firebaseService.signIn('test@example.com', 'password');

       expect(signInUser).toHaveBeenCalledWith('test@example.com', 'password');
       expect(result).toEqual({ user: mockUser });
     });

     test('signUp calls createUser with correct parameters', async () => {
       const mockUser = { uid: '123' };
       (createUser as jest.Mock).mockResolvedValue({ user: mockUser });

       const result = await firebaseService.signUp('test@example.com', 'password');

       expect(createUser).toHaveBeenCalledWith('test@example.com', 'password');
       expect(result).toEqual({ user: mockUser });
     });

     test('setData calls setDocument with correct parameters', async () => {
       const data = { name: 'Test' };
       await firebaseService.setData('users', '123', data, true);

       expect(setDocument).toHaveBeenCalledWith('users', '123', data, true);
     });

     test('getData calls getDocument with correct parameters', async () => {
       const mockData = { id: '123', name: 'Test' };
       (getDocument as jest.Mock).mockResolvedValue(mockData);

       const result = await firebaseService.getData('users', '123');

       expect(getDocument).toHaveBeenCalledWith('users', '123');
       expect(result).toEqual(mockData);
     });

     test('callCloudFunction calls callFunction with correct parameters', async () => {
       const mockData = { result: 'success' };
       const functionData = { param1: 'value1' };
       (callFunction as jest.Mock).mockResolvedValue(mockData);

       const result = await firebaseService.callCloudFunction('testFunction', functionData);

       expect(callFunction).toHaveBeenCalledWith('testFunction', functionData);
       expect(result).toEqual(mockData);
     });
   });
   ```

2. **User Authentication Organism**

   ```typescript
   import userAuth from '../../src/organisms/auth/userAuthentication';
   import firebaseService from '../../src/organisms/firebase/firebaseService';

   // Mock Firebase service
   jest.mock('../../src/organisms/firebase/firebaseService', () => ({
     default: {
       signIn: jest.fn(),
       signUp: jest.fn(),
       updateProfile: jest.fn(),
       sendPasswordReset: jest.fn(),
       getCurrentUser: jest.fn(),
       onAuthStateChanged: jest.fn(),
       getFirebaseAuth: jest.fn(),
       getData: jest.fn(),
       updateData: jest.fn(),
       refreshUserData: jest.fn(),
     },
   }));

   describe('User Authentication Organism', () => {
     beforeEach(() => {
       // Clear mocks before each test
       jest.clearAllMocks();
     });

     test('signIn calls firebaseService.signIn and returns user', async () => {
       const mockUser = { uid: '123', email: 'test@example.com' };
       (firebaseService.signIn as jest.Mock).mockResolvedValue({ user: mockUser });

       const result = await userAuth.signIn('test@example.com', 'password');

       expect(firebaseService.signIn).toHaveBeenCalledWith('test@example.com', 'password');
       expect(result).toEqual(mockUser);
     });

     test('signUp calls firebaseService.signUp and creates user document', async () => {
       const mockUser = { uid: '123', email: 'test@example.com' };
       (firebaseService.signUp as jest.Mock).mockResolvedValue({ user: mockUser });

       const result = await userAuth.signUp('test@example.com', 'password', 'Test User');

       expect(firebaseService.signUp).toHaveBeenCalledWith('test@example.com', 'password');
       expect(firebaseService.updateProfile).toHaveBeenCalledWith(mockUser, 'Test User');
       expect(firebaseService.setData).toHaveBeenCalledWith(
         'users',
         '123',
         expect.objectContaining({
           email: 'test@example.com',
           displayName: 'Test User',
         })
       );
       expect(result).toEqual(mockUser);
     });

     test('resetPassword calls firebaseService.sendPasswordReset', async () => {
       await userAuth.resetPassword('test@example.com');

       expect(firebaseService.sendPasswordReset).toHaveBeenCalledWith('test@example.com');
     });
   });
   ```

## 2. Integration Testing with Firebase Emulators

### Setup Firebase Emulators

1. **firebase.json Configuration**

   ```json
   {
     "emulators": {
       "auth": {
         "port": 9099
       },
       "functions": {
         "port": 5001
       },
       "firestore": {
         "port": 8080
       },
       "ui": {
         "enabled": true,
         "port": 4000
       }
     }
   }
   ```

2. **Emulator Initialization in Tests**

   ```typescript
   import { connectAuthEmulator, getAuth } from 'firebase/auth';
   import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
   import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
   import { initializeApp } from 'firebase/app';

   const setupEmulators = () => {
     const app = initializeApp({
       projectId: 'ai-sports-edge-test',
       apiKey: 'fake-api-key',
       authDomain: 'ai-sports-edge-test.firebaseapp.com',
     });

     const auth = getAuth(app);
     connectAuthEmulator(auth, 'http://localhost:9099');

     const firestore = getFirestore(app);
     connectFirestoreEmulator(firestore, 'localhost', 8080);

     const functions = getFunctions(app);
     connectFunctionsEmulator(functions, 'localhost', 5001);

     return { app, auth, firestore, functions };
   };
   ```

### Authentication Flow Tests

```typescript
import {
  initializeApp,
  getAuth,
  connectAuthEmulator,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';

describe('Authentication Integration Tests', () => {
  let auth;

  beforeAll(() => {
    const app = initializeApp({
      projectId: 'ai-sports-edge-test',
      apiKey: 'fake-api-key',
    });
    auth = getAuth(app);
    connectAuthEmulator(auth, 'http://localhost:9099');
  });

  beforeEach(async () => {
    // Clear users before each test
    await fetch('http://localhost:9099/emulator/v1/projects/ai-sports-edge-test/accounts', {
      method: 'DELETE',
    });
  });

  test('User can sign up with email and password', async () => {
    const email = 'test@example.com';
    const password = 'password123';

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    expect(userCredential.user).toBeDefined();
    expect(userCredential.user.email).toBe(email);
  });

  test('User can sign in after registration', async () => {
    const email = 'test@example.com';
    const password = 'password123';

    // First create the user
    await createUserWithEmailAndPassword(auth, email, password);

    // Then sign in
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    expect(userCredential.user).toBeDefined();
    expect(userCredential.user.email).toBe(email);
  });

  test('Wrong password returns appropriate error', async () => {
    const email = 'test@example.com';
    const password = 'password123';

    // First create the user
    await createUserWithEmailAndPassword(auth, email, password);

    // Try to sign in with wrong password
    try {
      await signInWithEmailAndPassword(auth, email, 'wrongpassword');
      fail('Should have thrown an error');
    } catch (error) {
      expect(error.code).toBe('auth/wrong-password');
    }
  });
});
```

### Firestore Integration Tests

```typescript
import {
  initializeApp,
  getFirestore,
  connectFirestoreEmulator,
  collection,
  addDoc,
  getDoc,
  doc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

describe('Firestore Integration Tests', () => {
  let firestore;

  beforeAll(() => {
    const app = initializeApp({
      projectId: 'ai-sports-edge-test',
      apiKey: 'fake-api-key',
    });
    firestore = getFirestore(app);
    connectFirestoreEmulator(firestore, 'localhost', 8080);
  });

  test('Can write and read user data', async () => {
    const userId = 'user123';
    const userData = {
      displayName: 'Test User',
      email: 'test@example.com',
      createdAt: new Date(),
    };

    // Write user data
    await setDoc(doc(firestore, 'users', userId), userData);

    // Read user data
    const userDoc = await getDoc(doc(firestore, 'users', userId));
    expect(userDoc.exists()).toBe(true);
    expect(userDoc.data().displayName).toBe('Test User');
  });

  test('Can query users by email', async () => {
    const usersData = [
      { id: 'user1', email: 'user1@example.com', displayName: 'User 1' },
      { id: 'user2', email: 'user2@example.com', displayName: 'User 2' },
      { id: 'user3', email: 'user3@example.com', displayName: 'User 3' },
    ];

    // Add test users
    for (const userData of usersData) {
      await setDoc(doc(firestore, 'users', userData.id), {
        email: userData.email,
        displayName: userData.displayName,
      });
    }

    // Query for user2
    const querySnapshot = await getDocs(
      query(collection(firestore, 'users'), where('email', '==', 'user2@example.com'))
    );

    expect(querySnapshot.size).toBe(1);
    expect(querySnapshot.docs[0].id).toBe('user2');
    expect(querySnapshot.docs[0].data().displayName).toBe('User 2');
  });
});
```

### Firebase Functions Integration Tests

```typescript
import {
  initializeApp,
  getFunctions,
  connectFunctionsEmulator,
  httpsCallable,
} from 'firebase/functions';

describe('Firebase Functions Integration Tests', () => {
  let functions;

  beforeAll(() => {
    const app = initializeApp({
      projectId: 'ai-sports-edge-test',
      apiKey: 'fake-api-key',
    });
    functions = getFunctions(app);
    connectFunctionsEmulator(functions, 'localhost', 5001);
  });

  test('Can call generateReferralCode function', async () => {
    const generateReferralCode = httpsCallable(functions, 'generateReferralCode');
    const result = await generateReferralCode({ userId: 'user123' });

    expect(result.data).toBeDefined();
    expect(result.data.code).toBeDefined();
    expect(typeof result.data.code).toBe('string');
    expect(result.data.code.length).toBeGreaterThan(0);
  });

  test('Can call rewardReferrer function', async () => {
    const rewardReferrer = httpsCallable(functions, 'rewardReferrer');
    const result = await rewardReferrer({
      referralCode: 'ABC123',
      newUserId: 'user456',
    });

    expect(result.data).toBeDefined();
    expect(result.data.success).toBeDefined();
  });
});
```

## 3. End-to-End Testing

### Auth Flow E2E Tests

```typescript
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, setDoc, doc, getDoc } from 'firebase/firestore';
import userAuth from '../../src/organisms/auth/userAuthentication';
import firebaseService from '../../src/organisms/firebase/firebaseService';

describe('Authentication End-to-End Tests', () => {
  let testEnv;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'ai-sports-edge-test',
      firestore: {
        host: 'localhost',
        port: 8080,
      },
      auth: {
        host: 'localhost',
        port: 9099,
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
    // Clear auth emulator
    await fetch('http://localhost:9099/emulator/v1/projects/ai-sports-edge-test/accounts', {
      method: 'DELETE',
    });
  });

  test('Full user registration and profile flow', async () => {
    const email = 'test@example.com';
    const password = 'password123';
    const displayName = 'Test User';

    // 1. Register new user
    const user = await userAuth.signUp(email, password, displayName);
    expect(user).toBeDefined();
    expect(user.email).toBe(email);

    // 2. Verify user document was created in Firestore
    const firestoreTestContext = testEnv.authenticatedContext(user.uid);
    const userDoc = await firestoreTestContext.firestore().collection('users').doc(user.uid).get();

    expect(userDoc.exists).toBe(true);
    expect(userDoc.data().email).toBe(email);
    expect(userDoc.data().displayName).toBe(displayName);

    // 3. Update user profile
    const newDisplayName = 'Updated Name';
    await userAuth.updateProfile(newDisplayName);

    // 4. Verify profile was updated
    const updatedUserDoc = await firestoreTestContext
      .firestore()
      .collection('users')
      .doc(user.uid)
      .get();

    expect(updatedUserDoc.data().displayName).toBe(newDisplayName);

    // 5. Sign out and sign back in
    await userAuth.signOut();
    const signedInUser = await userAuth.signIn(email, password);

    expect(signedInUser).toBeDefined();
    expect(signedInUser.uid).toBe(user.uid);

    // 6. Get current profile
    const profile = userAuth.getCurrentProfile();
    expect(profile).toBeDefined();
    expect(profile.displayName).toBe(newDisplayName);
  });
});
```

## 4. Performance Testing

### Firebase Functions Performance Tests

```typescript
import { initializeApp } from 'firebase/app';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';

describe('Firebase Functions Performance Tests', () => {
  let functions;

  beforeAll(() => {
    const app = initializeApp({
      projectId: 'ai-sports-edge-test',
      apiKey: 'fake-api-key',
    });
    functions = getFunctions(app);
    connectFunctionsEmulator(functions, 'localhost', 5001);
  });

  test('Generate referral code completes within 500ms', async () => {
    const generateReferralCode = httpsCallable(functions, 'generateReferralCode');

    const start = Date.now();
    await generateReferralCode({ userId: 'user123' });
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(500);
  });

  test('Reward referrer completes within 1000ms', async () => {
    const rewardReferrer = httpsCallable(functions, 'rewardReferrer');

    const start = Date.now();
    await rewardReferrer({ referralCode: 'ABC123', newUserId: 'user456' });
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(1000);
  });
});
```

### Firestore Query Performance Tests

```typescript
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  addDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

describe('Firestore Performance Tests', () => {
  let firestore;

  beforeAll(async () => {
    const app = initializeApp({
      projectId: 'ai-sports-edge-test',
      apiKey: 'fake-api-key',
    });
    firestore = getFirestore(app);
    connectFirestoreEmulator(firestore, 'localhost', 8080);

    // Create test data - 100 users
    const usersRef = collection(firestore, 'users');
    for (let i = 0; i < 100; i++) {
      await addDoc(usersRef, {
        email: `user${i}@example.com`,
        displayName: `User ${i}`,
        subscriptionStatus: i % 3 === 0 ? 'active' : 'inactive',
      });
    }
  });

  test('Query for active users completes within 100ms', async () => {
    const start = Date.now();

    const querySnapshot = await getDocs(
      query(collection(firestore, 'users'), where('subscriptionStatus', '==', 'active'))
    );

    const duration = Date.now() - start;

    expect(duration).toBeLessThan(100);
    expect(querySnapshot.size).toBe(34); // 100/3 rounded up
  });
});
```

## 5. Load Testing

For load testing, we'll use a separate script to simulate multiple concurrent users:

```javascript
// load-test.js
const firebase = require('firebase/app');
require('firebase/auth');
require('firebase/firestore');
require('firebase/functions');

const NUM_CONCURRENT_USERS = 50;
const OPERATIONS_PER_USER = 10;

async function runLoadTest() {
  // Initialize Firebase with emulator
  const app = firebase.initializeApp({
    projectId: 'ai-sports-edge-test',
    apiKey: 'fake-api-key',
  });

  const auth = firebase.auth(app);
  const firestore = firebase.firestore(app);
  const functions = firebase.functions(app);

  auth.useEmulator('http://localhost:9099');
  firestore.useEmulator('localhost', 8080);
  functions.useEmulator('localhost', 5001);

  console.log(`Starting load test with ${NUM_CONCURRENT_USERS} concurrent users`);

  const startTime = Date.now();
  const users = [];

  // Create users
  for (let i = 0; i < NUM_CONCURRENT_USERS; i++) {
    const email = `user${i}@loadtest.com`;
    const password = 'password123';

    try {
      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
      users.push({
        uid: userCredential.user.uid,
        email,
        password,
      });
      console.log(`Created user ${i + 1}/${NUM_CONCURRENT_USERS}`);
    } catch (error) {
      console.error(`Failed to create user ${i + 1}:`, error);
    }
  }

  // Run operations
  const operations = [];

  for (const user of users) {
    for (let i = 0; i < OPERATIONS_PER_USER; i++) {
      operations.push(runUserOperations(app, user));
    }
  }

  await Promise.all(operations);

  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  const totalOperations = NUM_CONCURRENT_USERS * OPERATIONS_PER_USER;

  console.log(`Load test completed: ${totalOperations} operations in ${duration} seconds`);
  console.log(`Average: ${totalOperations / duration} operations per second`);
}

async function runUserOperations(app, user) {
  try {
    // Sign in
    await firebase.auth().signInWithEmailAndPassword(user.email, user.password);

    // Write to Firestore
    await firebase.firestore().collection('users').doc(user.uid).set(
      {
        lastActive: firebase.firestore.FieldValue.serverTimestamp(),
        loadTestOperation: Math.random(),
      },
      { merge: true }
    );

    // Call a function
    const generateReferralCode = firebase.functions().httpsCallable('generateReferralCode');
    await generateReferralCode({ userId: user.uid });

    // Read from Firestore
    await firebase.firestore().collection('users').doc(user.uid).get();

    // Sign out
    await firebase.auth().signOut();

    return true;
  } catch (error) {
    console.error('Operation failed:', error);
    return false;
  }
}

runLoadTest();
```

## 6. Test Scripts for package.json

Add these scripts to package.json:

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=src/.*\\.test\\.ts",
    "test:integration": "jest --testPathPattern=integration/.*\\.test\\.ts",
    "test:e2e": "jest --testPathPattern=e2e/.*\\.test\\.ts",
    "test:performance": "jest --testPathPattern=performance/.*\\.test\\.ts",
    "emulators": "firebase emulators:start",
    "emulators:seed": "node scripts/seed-emulators.js",
    "test:load": "node scripts/load-test.js"
  }
}
```

## 7. Continuous Integration Testing

Set up a GitHub Actions workflow to run tests on every pull request:

```yaml
# .github/workflows/firebase-tests.yml
name: Firebase Tests

on:
  pull_request:
    branches: [main, development]
  push:
    branches: [main, development]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Install Firebase tools
        run: npm install -g firebase-tools
      - name: Start emulators
        run: firebase emulators:start --project=ai-sports-edge-test &
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
      - name: Wait for emulators to start
        run: sleep 10
      - name: Run unit tests
        run: npm run test:unit
      - name: Run integration tests
        run: npm run test:integration
      - name: Run end-to-end tests
        run: npm run test:e2e
```

## 8. Manual Testing Checklist

In addition to automated tests, perform these manual tests:

1. **Authentication**

   - [ ] New user registration works
   - [ ] Email verification is sent
   - [ ] Login with verified email works
   - [ ] Password reset flow works
   - [ ] Account recovery flows work
   - [ ] Profile updates save correctly

2. **Firebase Functions**

   - [ ] All functions can be called from client
   - [ ] Functions return expected results
   - [ ] Error handling works properly
   - [ ] Authentication checks in functions work

3. **Firestore**

   - [ ] Data is saved correctly
   - [ ] Queries return expected results
   - [ ] Security rules prevent unauthorized access
   - [ ] Complex queries perform adequately

4. **Cross-Browser Testing**

   - [ ] Works in Chrome
   - [ ] Works in Firefox
   - [ ] Works in Safari
   - [ ] Works in Edge

5. **Device Testing**
   - [ ] Works on iOS
   - [ ] Works on Android
   - [ ] Works on desktop web

## 9. Test Environment Setup Instructions

1. Install dependencies:

   ```bash
   npm install
   npm install -g firebase-tools
   ```

2. Start Firebase emulators:

   ```bash
   firebase emulators:start
   ```

3. Seed test data (optional):

   ```bash
   npm run emulators:seed
   ```

4. Run tests:
   ```bash
   npm test
   ```

This testing plan ensures comprehensive verification of the Firebase migration implementation, addressing all aspects from unit testing of individual components to end-to-end testing of the complete system.
