import { initializeApp, FirebaseError } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { info, error as logError, LogCategory } from '../services/loggingService';
import { safeErrorCapture } from '../services/errorUtils';

// Load environment variables
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  
  // For Expo/React Native
  if (typeof global !== 'undefined') {
    // Use type assertion for global
    const globalAny = global as any;
    if (globalAny.__expo && globalAny.__expo.Constants) {
      const expoConstants = globalAny.__expo.Constants;
      return expoConstants.manifest?.extra?.[key] || defaultValue;
    }
  }
  
  return defaultValue;
};

// Firebase configuration
const firebaseConfig = {
  apiKey: getEnvVar('FIREBASE_API_KEY'),
  authDomain: getEnvVar('FIREBASE_AUTH_DOMAIN', 'ai-sports-edge.firebaseapp.com'),
  projectId: getEnvVar('FIREBASE_PROJECT_ID', 'ai-sports-edge'),
  storageBucket: getEnvVar('FIREBASE_STORAGE_BUCKET', 'ai-sports-edge.appspot.com'),
  messagingSenderId: getEnvVar('FIREBASE_MESSAGING_SENDER_ID', '123456789012'),
  appId: getEnvVar('FIREBASE_APP_ID', '1:123456789012:web:abcdef1234567890'),
  measurementId: getEnvVar('FIREBASE_MEASUREMENT_ID', 'G-ABCDEFGHIJ')
};

// Initialize Firebase with error handling
let app;
let auth;
let firestore;
let functions;

try {
  console.log('Firebase: Initializing Firebase app');
  info(LogCategory.APP, 'Initializing Firebase');
  
  // Log the configuration (without sensitive values)
  console.log('Firebase: Configuration', {
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    // Don't log apiKey or other sensitive values
  });
  
  // Check if required configuration is present
  if (!firebaseConfig.apiKey) {
    console.warn('Firebase: API Key is missing or empty');
    info(LogCategory.APP, 'Firebase API Key is missing, using default value');
  }
  
  // Initialize the app
  app = initializeApp(firebaseConfig);
  console.log('Firebase: App initialized successfully');
  
  // Initialize Firebase services with error handling
  try {
    console.log('Firebase: Initializing Auth service');
    auth = getAuth(app);
    console.log('Firebase: Auth service initialized');
  } catch (authError) {
    console.error('Firebase: Failed to initialize Auth service:', authError);
    logError(LogCategory.APP, 'Failed to initialize Firebase Auth service', authError as Error);
    safeErrorCapture(authError as Error);
    // Create a placeholder auth object to prevent null references
    auth = {} as any;
  }
  
  try {
    console.log('Firebase: Initializing Firestore service');
    firestore = getFirestore(app);
    console.log('Firebase: Firestore service initialized');
  } catch (firestoreError) {
    console.error('Firebase: Failed to initialize Firestore service:', firestoreError);
    logError(LogCategory.APP, 'Failed to initialize Firebase Firestore service', firestoreError as Error);
    safeErrorCapture(firestoreError as Error);
    // Create a placeholder firestore object to prevent null references
    firestore = {} as any;
  }
  
  try {
    console.log('Firebase: Initializing Functions service');
    functions = getFunctions(app);
    console.log('Firebase: Functions service initialized');
  } catch (functionsError) {
    console.error('Firebase: Failed to initialize Functions service:', functionsError);
    logError(LogCategory.APP, 'Failed to initialize Firebase Functions service', functionsError as Error);
    safeErrorCapture(functionsError as Error);
    // Create a placeholder functions object to prevent null references
    functions = {} as any;
  }
  
  info(LogCategory.APP, 'Firebase services initialized successfully');
} catch (error) {
  console.error('Firebase: Failed to initialize Firebase:', error);
  logError(LogCategory.APP, 'Failed to initialize Firebase', error as Error);
  safeErrorCapture(error as Error);
  
  // Create placeholder objects to prevent null references
  app = {} as any;
  auth = {} as any;
  firestore = {} as any;
  functions = {} as any;
  
  // Log a warning that Firebase initialization failed
  console.warn('Firebase: Using placeholder Firebase services due to initialization failure');
}

export { app, auth, firestore, functions };