# Firebase Migration Implementation Plan

This document outlines the comprehensive implementation plan for completing the Firebase migration following atomic architecture principles. It addresses consolidation of configuration files, package upgrades, authentication enhancements, and testing strategies.

## 1. Current State Assessment

### Firebase Configuration Files

- We currently have multiple Firebase configuration files:
  - `config/firebase.ts`: Main TypeScript implementation
  - `config/firebase.js`: Mock version for testing
  - `config/firebase-production.json`: Production configuration
  - 6+ additional config files that need consolidation

### Firebase Functions

- Current Node.js runtime: v18 (needs upgrade to v20 by April 2025)
- Firebase Functions SDK: v4.3.1 (needs upgrade)
- Authentication implementation needs enhancement

## 2. Atomic Architecture for Firebase Implementation

### Atoms (Basic Configuration Elements)

#### 1. Firebase Config Atom (`src/atoms/firebase/firebaseConfig.ts`)

```typescript
/**
 * Firebase configuration atom
 * Contains basic configuration elements like API keys and project settings
 */
export interface FirebaseConfigAtom {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
  databaseURL?: string;
  locationId?: string;
  production?: boolean;
}

// Environment-specific configurations
export const getFirebaseConfig = (environment: string): FirebaseConfigAtom => {
  switch (environment) {
    case 'production':
      return {
        apiKey: process.env.FIREBASE_API_KEY || '',
        authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'ai-sports-edge-prod.firebaseapp.com',
        projectId: process.env.FIREBASE_PROJECT_ID || 'ai-sports-edge-prod',
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'ai-sports-edge-prod.appspot.com',
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '123456789012',
        appId: process.env.FIREBASE_APP_ID || '1:123456789012:web:abcdef1234567890',
        measurementId: process.env.FIREBASE_MEASUREMENT_ID || 'G-ABCDEF1234',
        databaseURL:
          process.env.FIREBASE_DATABASE_URL || 'https://ai-sports-edge-prod.firebaseio.com',
        locationId: process.env.FIREBASE_LOCATION_ID || 'us-central',
        production: true,
      };
    case 'staging':
      return {
        apiKey: process.env.FIREBASE_API_KEY_STAGING || '',
        authDomain:
          process.env.FIREBASE_AUTH_DOMAIN_STAGING || 'ai-sports-edge-staging.firebaseapp.com',
        projectId: process.env.FIREBASE_PROJECT_ID_STAGING || 'ai-sports-edge-staging',
        storageBucket:
          process.env.FIREBASE_STORAGE_BUCKET_STAGING || 'ai-sports-edge-staging.appspot.com',
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID_STAGING || '123456789012',
        appId: process.env.FIREBASE_APP_ID_STAGING || '1:123456789012:web:abcdef1234567890',
        measurementId: process.env.FIREBASE_MEASUREMENT_ID_STAGING || 'G-ABCDEF1234',
        databaseURL:
          process.env.FIREBASE_DATABASE_URL_STAGING ||
          'https://ai-sports-edge-staging.firebaseio.com',
        locationId: process.env.FIREBASE_LOCATION_ID_STAGING || 'us-central',
        production: false,
      };
    case 'development':
    default:
      return {
        apiKey: process.env.FIREBASE_API_KEY_DEV || '',
        authDomain: process.env.FIREBASE_AUTH_DOMAIN_DEV || 'ai-sports-edge-dev.firebaseapp.com',
        projectId: process.env.FIREBASE_PROJECT_ID_DEV || 'ai-sports-edge-dev',
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET_DEV || 'ai-sports-edge-dev.appspot.com',
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID_DEV || '123456789012',
        appId: process.env.FIREBASE_APP_ID_DEV || '1:123456789012:web:abcdef1234567890',
        measurementId: process.env.FIREBASE_MEASUREMENT_ID_DEV || 'G-ABCDEF1234',
        databaseURL:
          process.env.FIREBASE_DATABASE_URL_DEV || 'https://ai-sports-edge-dev.firebaseio.com',
        locationId: process.env.FIREBASE_LOCATION_ID_DEV || 'us-central',
        production: false,
      };
  }
};

// Default configuration accessor
export const getDefaultFirebaseConfig = (): FirebaseConfigAtom => {
  const environment =
    process.env.NODE_ENV === 'production'
      ? 'production'
      : process.env.NODE_ENV === 'staging'
      ? 'staging'
      : 'development';
  return getFirebaseConfig(environment);
};
```

#### 2. Error Handler Atom (`src/atoms/error/errorHandlerAtom.ts`)

```typescript
/**
 * Error handler atom for consistent error handling
 */
export interface ErrorDetail {
  code: string;
  message: string;
  context?: Record<string, any>;
  timestamp: number;
}

export const createErrorDetail = (
  code: string,
  message: string,
  context?: Record<string, any>
): ErrorDetail => ({
  code,
  message,
  context,
  timestamp: Date.now(),
});

export const logError = (error: ErrorDetail): void => {
  console.error(`[Error ${error.code}]: ${error.message}`, error.context);

  // Can be extended with additional logging services
};

export const formatAuthError = (error: any): ErrorDetail => {
  const errorCode = error.code || 'auth/unknown';
  const errorMessage = error.message || 'An unknown authentication error occurred';

  return createErrorDetail(errorCode, errorMessage, { originalError: error });
};
```

#### 3. Environment Variable Atom (`src/atoms/env/environmentAtom.ts`)

```typescript
/**
 * Environment variable atom for accessing environment variables consistently
 */
export const getEnvVar = (key: string, defaultValue: string = ''): string => {
  // For Node.js environment
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }

  // For Expo/React Native
  if (typeof global !== 'undefined') {
    const globalAny = global as any;
    if (globalAny.__expo && globalAny.__expo.Constants) {
      const expoConstants = globalAny.__expo.Constants;
      return expoConstants.manifest?.extra?.[key] || defaultValue;
    }
  }

  return defaultValue;
};

export const getEnvironment = (): 'development' | 'staging' | 'production' => {
  const env = getEnvVar('NODE_ENV', 'development');
  if (env === 'production' || env === 'staging') {
    return env;
  }
  return 'development';
};
```

### Molecules (Firebase Service Initializations)

#### 1. Firebase App Molecule (`src/molecules/firebase/firebaseApp.ts`)

```typescript
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getEnvVar } from '../../atoms/env/environmentAtom';
import { getDefaultFirebaseConfig, FirebaseConfigAtom } from '../../atoms/firebase/firebaseConfig';
import { createErrorDetail, logError } from '../../atoms/error/errorHandlerAtom';

// Singleton instance
let firebaseAppInstance: FirebaseApp | null = null;

/**
 * Initialize Firebase app with error handling
 */
export const initializeFirebaseApp = (config?: FirebaseConfigAtom): FirebaseApp => {
  try {
    // Use provided config or get default
    const firebaseConfig = config || getDefaultFirebaseConfig();

    // Log non-sensitive configuration for debugging
    console.log('Firebase: Initializing with configuration', {
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
      // Don't log sensitive values like API keys
    });

    // Initialize app if not already initialized
    if (!firebaseAppInstance) {
      firebaseAppInstance = initializeApp(firebaseConfig);
      console.log('Firebase: App initialized successfully');
    }

    return firebaseAppInstance;
  } catch (error) {
    const errorDetail = createErrorDetail(
      'firebase/initialization-error',
      'Failed to initialize Firebase app',
      { error }
    );
    logError(errorDetail);
    throw error;
  }
};

/**
 * Get the Firebase app instance, initializing if necessary
 */
export const getFirebaseApp = (): FirebaseApp => {
  if (!firebaseAppInstance) {
    return initializeFirebaseApp();
  }
  return firebaseAppInstance;
};
```

#### 2. Authentication Molecule (`src/molecules/firebase/firebaseAuth.ts`)

```typescript
import {
  getAuth,
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  User,
  UserCredential,
  onAuthStateChanged,
} from 'firebase/auth';
import { getFirebaseApp } from './firebaseApp';
import { createErrorDetail, logError, formatAuthError } from '../../atoms/error/errorHandlerAtom';

// Singleton instance
let authInstance: Auth | null = null;

/**
 * Get Firebase Auth instance
 */
export const getFirebaseAuth = (): Auth => {
  try {
    if (!authInstance) {
      const app = getFirebaseApp();
      authInstance = getAuth(app);
      console.log('Firebase: Auth service initialized');
    }
    return authInstance;
  } catch (error) {
    const errorDetail = createErrorDetail(
      'firebase/auth-initialization-error',
      'Failed to initialize Firebase Auth',
      { error }
    );
    logError(errorDetail);
    throw error;
  }
};

/**
 * Sign in user with email and password
 */
export const signInUser = async (email: string, password: string): Promise<UserCredential> => {
  try {
    const auth = getFirebaseAuth();
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    const errorDetail = formatAuthError(error);
    logError(errorDetail);
    throw error;
  }
};

/**
 * Create new user with email and password
 */
export const createUser = async (email: string, password: string): Promise<UserCredential> => {
  try {
    const auth = getFirebaseAuth();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // Send email verification by default
    await sendEmailVerification(userCredential.user);

    return userCredential;
  } catch (error) {
    const errorDetail = formatAuthError(error);
    logError(errorDetail);
    throw error;
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  user: User,
  displayName?: string | null,
  photoURL?: string | null
): Promise<void> => {
  try {
    await updateProfile(user, {
      displayName: displayName || user.displayName,
      photoURL: photoURL || user.photoURL,
    });
  } catch (error) {
    const errorDetail = formatAuthError(error);
    logError(errorDetail);
    throw error;
  }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    const auth = getFirebaseAuth();
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    const errorDetail = formatAuthError(error);
    logError(errorDetail);
    throw error;
  }
};

/**
 * Listen to auth state changes
 */
export const subscribeToAuthChanges = (callback: (user: User | null) => void): (() => void) => {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, callback);
};
```

#### 3. Firestore Molecule (`src/molecules/firebase/firebaseFirestore.ts`)

```typescript
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  DocumentData,
  QueryConstraint,
  CollectionReference,
} from 'firebase/firestore';
import { getFirebaseApp } from './firebaseApp';
import { createErrorDetail, logError } from '../../atoms/error/errorHandlerAtom';

// Singleton instance
let firestoreInstance: Firestore | null = null;

/**
 * Get Firebase Firestore instance
 */
export const getFirebaseFirestore = (): Firestore => {
  try {
    if (!firestoreInstance) {
      const app = getFirebaseApp();
      firestoreInstance = getFirestore(app);
      console.log('Firebase: Firestore service initialized');
    }
    return firestoreInstance;
  } catch (error) {
    const errorDetail = createErrorDetail(
      'firebase/firestore-initialization-error',
      'Failed to initialize Firebase Firestore',
      { error }
    );
    logError(errorDetail);
    throw error;
  }
};

/**
 * Get a collection reference
 */
export const getCollection = <T = DocumentData>(collectionPath: string): CollectionReference<T> => {
  const firestore = getFirebaseFirestore();
  return collection(firestore, collectionPath) as CollectionReference<T>;
};

/**
 * Create a query on a collection
 */
export const createQuery = <T = DocumentData>(
  collectionPath: string,
  ...queryConstraints: QueryConstraint[]
) => {
  const collectionRef = getCollection<T>(collectionPath);
  return query(collectionRef, ...queryConstraints);
};

/**
 * Add or update a document in Firestore
 */
export const setDocument = async <T>(
  collectionPath: string,
  docId: string,
  data: T,
  merge: boolean = true
): Promise<void> => {
  try {
    const firestore = getFirebaseFirestore();
    const docRef = doc(firestore, collectionPath, docId);
    await setDoc(docRef, data as any, { merge });
  } catch (error) {
    const errorDetail = createErrorDetail(
      'firebase/firestore-set-error',
      `Failed to set document in ${collectionPath}/${docId}`,
      { error, data }
    );
    logError(errorDetail);
    throw error;
  }
};

/**
 * Update an existing document in Firestore
 */
export const updateDocument = async (
  collectionPath: string,
  docId: string,
  data: Partial<any>
): Promise<void> => {
  try {
    const firestore = getFirebaseFirestore();
    const docRef = doc(firestore, collectionPath, docId);
    await updateDoc(docRef, data);
  } catch (error) {
    const errorDetail = createErrorDetail(
      'firebase/firestore-update-error',
      `Failed to update document in ${collectionPath}/${docId}`,
      { error, data }
    );
    logError(errorDetail);
    throw error;
  }
};

/**
 * Get a document from Firestore
 */
export const getDocument = async <T>(collectionPath: string, docId: string): Promise<T | null> => {
  try {
    const firestore = getFirebaseFirestore();
    const docRef = doc(firestore, collectionPath, docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as unknown as T;
    }

    return null;
  } catch (error) {
    const errorDetail = createErrorDetail(
      'firebase/firestore-get-error',
      `Failed to get document from ${collectionPath}/${docId}`,
      { error }
    );
    logError(errorDetail);
    throw error;
  }
};
```

#### 4. Functions Molecule (`src/molecules/firebase/firebaseFunctions.ts`)

```typescript
import {
  getFunctions,
  httpsCallable,
  Functions,
  HttpsCallable,
  HttpsCallableResult,
} from 'firebase/functions';
import { getFirebaseApp } from './firebaseApp';
import { createErrorDetail, logError } from '../../atoms/error/errorHandlerAtom';

// Singleton instance
let functionsInstance: Functions | null = null;

/**
 * Get Firebase Functions instance
 */
export const getFirebaseFunctions = (): Functions => {
  try {
    if (!functionsInstance) {
      const app = getFirebaseApp();
      functionsInstance = getFunctions(app);
      console.log('Firebase: Functions service initialized');
    }
    return functionsInstance;
  } catch (error) {
    const errorDetail = createErrorDetail(
      'firebase/functions-initialization-error',
      'Failed to initialize Firebase Functions',
      { error }
    );
    logError(errorDetail);
    throw error;
  }
};

/**
 * Generic function to call a Firebase Cloud Function
 */
export const callFunction = async <T = any, R = any>(
  functionName: string,
  data?: T
): Promise<R> => {
  try {
    const functions = getFirebaseFunctions();
    const functionCall = httpsCallable<T, R>(functions, functionName);
    const result = await functionCall(data as T);
    return result.data;
  } catch (error) {
    const errorDetail = createErrorDetail(
      'firebase/function-call-error',
      `Failed to call function ${functionName}`,
      { error, functionData: data }
    );
    logError(errorDetail);
    throw error;
  }
};
```

### Organisms (Complete Firebase Service Modules)

#### 1. Firebase Service Organism (`src/organisms/firebase/firebaseService.ts`)

```typescript
import { User } from 'firebase/auth';
import { getFirebaseApp } from '../../molecules/firebase/firebaseApp';
import {
  getFirebaseAuth,
  signInUser,
  createUser,
  updateUserProfile,
  resetPassword,
  subscribeToAuthChanges,
} from '../../molecules/firebase/firebaseAuth';
import {
  getFirebaseFirestore,
  getCollection,
  createQuery,
  setDocument,
  updateDocument,
  getDocument,
} from '../../molecules/firebase/firebaseFirestore';
import { getFirebaseFunctions, callFunction } from '../../molecules/firebase/firebaseFunctions';

/**
 * Firebase Service Organism
 * Provides a unified interface for all Firebase services
 */
export class FirebaseService {
  // Initialize Firebase App
  public initializeApp() {
    return getFirebaseApp();
  }

  // Authentication Methods
  public async signIn(email: string, password: string) {
    return signInUser(email, password);
  }

  public async signUp(email: string, password: string) {
    return createUser(email, password);
  }

  public async updateProfile(user: User, displayName?: string | null, photoURL?: string | null) {
    return updateUserProfile(user, displayName, photoURL);
  }

  public async sendPasswordReset(email: string) {
    return resetPassword(email);
  }

  public onAuthStateChanged(callback: (user: User | null) => void) {
    return subscribeToAuthChanges(callback);
  }

  public getCurrentUser() {
    const auth = getFirebaseAuth();
    return auth.currentUser;
  }

  public isUserVerified() {
    const user = this.getCurrentUser();
    return user?.emailVerified || false;
  }

  public async refreshUserData() {
    const user = this.getCurrentUser();
    if (user) {
      await user.reload();
      return user;
    }
    return null;
  }

  // Firestore Methods
  public async setData<T>(collection: string, docId: string, data: T, merge: boolean = true) {
    return setDocument<T>(collection, docId, data, merge);
  }

  public async updateData(collection: string, docId: string, data: Partial<any>) {
    return updateDocument(collection, docId, data);
  }

  public async getData<T>(collection: string, docId: string) {
    return getDocument<T>(collection, docId);
  }

  // Functions Methods
  public async callCloudFunction<T = any, R = any>(functionName: string, data?: T) {
    return callFunction<T, R>(functionName, data);
  }
}

// Create singleton instance
const firebaseService = new FirebaseService();
export default firebaseService;
```

#### 2. User Authentication Organism (`src/organisms/auth/userAuthentication.ts`)

```typescript
import { User } from 'firebase/auth';
import firebaseService from '../firebase/firebaseService';
import { createErrorDetail, logError } from '../../atoms/error/errorHandlerAtom';

/**
 * Extended User interface with additional profile data
 */
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
  isSubscribed: boolean;
  subscriptionTier?: string;
  createdAt: Date;
  lastLogin: Date;
}

/**
 * User Authentication Organism
 * Provides enhanced authentication features
 */
export class UserAuthentication {
  // Store current user profile
  private userProfile: UserProfile | null = null;

  // Event listeners
  private profileChangeListeners: ((profile: UserProfile | null) => void)[] = [];

  constructor() {
    // Initialize auth state listener
    firebaseService.onAuthStateChanged(this.handleAuthStateChange.bind(this));
  }

  /**
   * Handle Firebase Auth state changes
   */
  private async handleAuthStateChange(user: User | null) {
    if (user) {
      await this.loadUserProfile(user);
    } else {
      this.userProfile = null;
      this.notifyProfileListeners();
    }
  }

  /**
   * Load user profile from Firestore
   */
  private async loadUserProfile(user: User) {
    try {
      // Get user data from Firestore
      const userData = await firebaseService.getData<any>('users', user.uid);

      // Create user profile
      this.userProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        phoneNumber: user.phoneNumber,
        isSubscribed: userData?.subscriptionStatus === 'active',
        subscriptionTier: userData?.subscriptionTier,
        createdAt: userData?.createdAt ? new Date(userData.createdAt.toDate()) : new Date(),
        lastLogin: new Date(),
      };

      // Update last login timestamp
      await firebaseService.updateData('users', user.uid, {
        lastLogin: new Date(),
      });

      this.notifyProfileListeners();
    } catch (error) {
      const errorDetail = createErrorDetail(
        'auth/profile-load-error',
        'Failed to load user profile',
        { error, userId: user.uid }
      );
      logError(errorDetail);

      // Create minimal profile from auth data
      this.userProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        phoneNumber: user.phoneNumber,
        isSubscribed: false,
        createdAt: new Date(),
        lastLogin: new Date(),
      };

      this.notifyProfileListeners();
    }
  }

  /**
   * Notify all profile change listeners
   */
  private notifyProfileListeners() {
    this.profileChangeListeners.forEach(listener => {
      listener(this.userProfile);
    });
  }

  /**
   * Sign in with email and password
   */
  public async signIn(email: string, password: string) {
    try {
      const userCredential = await firebaseService.signIn(email, password);
      return userCredential.user;
    } catch (error: any) {
      // Enhanced error handling
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        throw new Error('Invalid email or password');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error(
          'Too many failed login attempts. Please try again later or reset your password.'
        );
      } else {
        throw error;
      }
    }
  }

  /**
   * Sign up with email and password
   */
  public async signUp(email: string, password: string, displayName?: string) {
    const userCredential = await firebaseService.signUp(email, password);
    const user = userCredential.user;

    // Set display name if provided
    if (displayName) {
      await firebaseService.updateProfile(user, displayName);
    }

    // Create user document in Firestore
    await firebaseService.setData('users', user.uid, {
      email: user.email,
      displayName: displayName || null,
      createdAt: new Date(),
      lastLogin: new Date(),
      emailVerified: false,
    });

    return user;
  }

  /**
   * Sign out current user
   */
  public async signOut() {
    const auth = firebaseService.getFirebaseAuth();
    await auth.signOut();
  }

  /**
   * Send email verification to current user
   */
  public async sendEmailVerification() {
    const user = firebaseService.getCurrentUser();
    if (user) {
      await firebaseService.getFirebaseAuth().currentUser?.sendEmailVerification();
    } else {
      throw new Error('No user is currently signed in');
    }
  }

  /**
   * Send password reset email
   */
  public async resetPassword(email: string) {
    await firebaseService.sendPasswordReset(email);
  }

  /**
   * Update user profile
   */
  public async updateProfile(displayName?: string, photoURL?: string) {
    const user = firebaseService.getCurrentUser();
    if (user) {
      await firebaseService.updateProfile(user, displayName, photoURL);

      // Update Firestore document
      const updateData: Record<string, any> = {
        updatedAt: new Date(),
      };

      if (displayName !== undefined) {
        updateData.displayName = displayName;
      }

      if (photoURL !== undefined) {
        updateData.photoURL = photoURL;
      }

      await firebaseService.updateData('users', user.uid, updateData);

      // Refresh user profile
      await this.refreshProfile();
    } else {
      throw new Error('No user is currently signed in');
    }
  }

  /**
   * Get current user profile
   */
  public getCurrentProfile(): UserProfile | null {
    return this.userProfile;
  }

  /**
   * Refresh user profile from server
   */
  public async refreshProfile() {
    const user = await firebaseService.refreshUserData();
    if (user) {
      await this.loadUserProfile(user);
    }
    return this.userProfile;
  }

  /**
   * Subscribe to profile changes
   */
  public onProfileChange(listener: (profile: UserProfile | null) => void): () => void {
    this.profileChangeListeners.push(listener);

    // Immediately notify with current state
    listener(this.userProfile);

    // Return unsubscribe function
    return () => {
      this.profileChangeListeners = this.profileChangeListeners.filter(l => l !== listener);
    };
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return !!this.userProfile;
  }

  /**
   * Check if user's email is verified
   */
  public isEmailVerified(): boolean {
    return this.userProfile?.emailVerified || false;
  }

  /**
   * Check if user has an active subscription
   */
  public isSubscribed(): boolean {
    return this.userProfile?.isSubscribed || false;
  }
}

// Create singleton instance
const userAuth = new UserAuthentication();
export default userAuth;
```

#### 3. Firebase Functions Organism (`src/organisms/functions/firebaseFunctionsService.ts`)

```typescript
import firebaseService from '../firebase/firebaseService';

/**
 * Firebase Functions Service Organism
 * Provides specific function calls with proper typing
 */
export class FirebaseFunctionsService {
  /**
   * Generate a referral code for a user
   */
  public async generateReferralCode(userId: string): Promise<{ code: string }> {
    return firebaseService.callCloudFunction<{ userId: string }, { code: string }>(
      'generateReferralCode',
      { userId }
    );
  }

  /**
   * Process a referral reward
   */
  public async rewardReferrer(
    referralCode: string,
    newUserId: string
  ): Promise<{ success: boolean; referrerId?: string }> {
    return firebaseService.callCloudFunction<
      { referralCode: string; newUserId: string },
      { success: boolean; referrerId?: string }
    >('rewardReferrer', { referralCode, newUserId });
  }

  /**
   * Create a Stripe checkout session
   */
  public async createCheckoutSession(
    userId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<{ sessionId: string; url: string }> {
    return firebaseService.callCloudFunction<
      { userId: string; priceId: string; successUrl: string; cancelUrl: string },
      { sessionId: string; url: string }
    >('createCheckoutSession', { userId, priceId, successUrl, cancelUrl });
  }

  /**
   * Create a customer portal session
   */
  public async createPortalSession(userId: string, returnUrl: string): Promise<{ url: string }> {
    return firebaseService.callCloudFunction<
      { userId: string; returnUrl: string },
      { url: string }
    >('createPortalSession', { userId, returnUrl });
  }

  /**
   * Create a location-based notification
   */
  public async createLocationNotification(
    userId: string,
    latitude: number,
    longitude: number,
    radius: number,
    message: string,
    expiresAt: Date
  ): Promise<{ notificationId: string }> {
    return firebaseService.callCloudFunction<
      {
        userId: string;
        location: { latitude: number; longitude: number; radius: number };
        message: string;
        expiresAt: number;
      },
      { notificationId: string }
    >('createLocationNotification', {
      userId,
      location: { latitude, longitude, radius },
      message,
      expiresAt: expiresAt.getTime(),
    });
  }
}

// Create singleton instance
const firebaseFunctions = new FirebaseFunctionsService();
export default firebaseFunctions;
```

## 3. Package Upgrade Strategy

### Current State

- Node.js: v18 (functions/package.json)
- firebase-admin: v11.8.0
- firebase-functions: v4.3.1

### Target State

- Node.js: v20 (latest LTS)
- firebase-admin: v12.x
- firebase-functions: v4.5.x or latest

### Upgrade Steps

1. **Update Functions Runtime in package.json**

```json
{
  "engines": {
    "node": "20"
  }
}
```

2. **Update Firebase SDK Dependencies**

```bash
cd functions
npm install firebase-admin@latest firebase-functions@latest --save
```

3. **Handle Breaking Changes**

For Firebase Admin SDK v12:

- Updates to Auth, Firestore, and Storage APIs
- New security features
- Performance improvements

For Firebase Functions SDK v4.5+:

- Enhanced TypeScript support
- Improved cold start performance
- New features for HTTP functions

4. **Testing Strategy for Package Upgrades**

- Create a staging environment to test upgraded packages
- Run local emulator tests with new versions
- Deploy to staging and run integration tests
- Monitor error rates and performance before production rollout

## 4. Firebase Authentication Enhancements

### Enhanced Error Handling

- Implement comprehensive error codes and messages
- Create user-friendly error messages for common scenarios
- Add logging for authentication events and errors
- Implement retry mechanisms for transient failures

### User Profile Management

- Store extended profile information in Firestore
- Synchronize profile changes between Auth and Firestore
- Implement profile completion tracking
- Add profile data validation

### Email Verification Improvements

- Enhanced email templates with branding
- Multi-language support for verification emails
- Verification reminder system
- Session handling for unverified users

## 5. Testing Strategy

### Unit Testing

- Test atoms in isolation
- Mock Firebase services for molecule testing
- Use Jest for test framework

### Integration Testing

- Test Firebase service organisms with Firebase emulators
- Validate authentication flows end-to-end
- Test error handling scenarios

### Regression Testing

- Ensure existing functionality works after upgrades
- Validate all Firebase configuration settings
- Test across different environments (dev, staging, prod)

### Performance Testing

- Measure function cold start times
- Evaluate Firestore query performance
- Test authentication flow latency

## 6. Implementation Timeline

### Phase 1: Configuration Consolidation (Week 1)

- Create Firebase configuration atoms
- Implement configuration loading and validation
- Set up environment-specific configurations

### Phase 2: Service Initialization (Week 1-2)

- Implement Firebase service molecules
- Create error handling systems
- Test service initialization

### Phase 3: Package Upgrades (Week 2)

- Update Node.js runtime and dependencies
- Adapt code for breaking changes
- Test with emulators

### Phase 4: Authentication Enhancements (Week 3)

- Implement enhanced error handling
- Build user profile management
- Add email verification improvements

### Phase 5: Testing and Deployment (Week 4)

- Comprehensive testing across environments
- Prepare deployment packages
- Deploy to production with monitoring

## 7. Conclusion

This implementation plan provides a comprehensive approach to Firebase migration using atomic architecture principles. By breaking down the implementation into atoms, molecules, and organisms, we ensure a clean, modular, and maintainable codebase that follows best practices. The plan addresses all requirements including configuration consolidation, package upgrades, authentication enhancements, and testing strategies.

Once implemented, this architecture will provide a solid foundation for future Firebase feature development and maintenance.
