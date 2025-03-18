import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getFunctions, Functions } from 'firebase/functions';
import { isDevelopmentMode } from '../utils/environmentUtils';
import { Platform } from 'react-native';

// Your Firebase config (replace with your actual values)
const firebaseConfig = {
  apiKey: "AIzaSyDxLufbPyNYpax2MmE5ff27MHA-js9INBw",
  authDomain: "AI Sports Edge.firebaseapp.com",
  projectId: "ai-sports-edge",
  storageBucket: "ai-sports-edge.appspot.com",
  messagingSenderId: "63216708515",
  appId: "1:63216708515:web:209e6baf130386edb00816"
};

// Initialize Firebase with error handling
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;
let functions: Functions | null = null;

console.log('Starting Firebase initialization...');

try {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  console.log('Firebase app initialized successfully');

  // Get the auth, firestore, and functions instances
  auth = getAuth(app);
  console.log('Firebase auth initialized');
  
  /* NOTE: Firebase Auth Warning
   * There's a warning about using AsyncStorage with Firebase Auth for persistence.
   * To implement this properly, we would need to:
   * 1. Import AsyncStorage from '@react-native-async-storage/async-storage'
   * 2. Use initializeAuth with getReactNativePersistence
   *
   * Example implementation:
   * import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
   * import AsyncStorage from '@react-native-async-storage/async-storage';
   *
   * const auth = initializeAuth(app, {
   *   persistence: getReactNativePersistence(AsyncStorage)
   * });
   *
   * This would require additional configuration and testing, so we're leaving it
   * as a future enhancement. For now, auth state will not persist between sessions.
   */
  
  firestore = getFirestore(app);
  console.log('Firebase firestore initialized');
  
  functions = getFunctions(app);
  console.log('Firebase functions initialized');
} catch (error) {
  console.warn('Firebase initialization failed:', error);
  console.info('App will run in development mode with mock data');
}

// Check if we're in development mode
const isDevMode = isDevelopmentMode();
console.log('Is development mode:', isDevMode);

// Export the Firebase services and development mode flag
export { app, auth, firestore, functions, isDevMode };