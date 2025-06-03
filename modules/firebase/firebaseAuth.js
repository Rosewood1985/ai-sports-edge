/**
 * Firebase Authentication
 *
 * Provides Firebase authentication functionality.
 */

import { getAuth, onAuthStateChanged } from 'firebase/auth';

import { firebaseApp, getFirebaseApp } from './firebaseConfig';

let auth = null;

/**
 * Initialize Firebase Auth
 * @returns {Object|null} Firebase Auth instance or null if initialization failed
 */
export const initializeFirebaseAuth = () => {
  try {
    // Get Firebase app instance
    const app = getFirebaseApp();
    if (!app) {
      console.error('Firebase Auth initialization failed: Firebase app not initialized');
      return null;
    }

    // Initialize Auth
    auth = getAuth(app);

    // Add better error handling for auth operations
    onAuthStateChanged(
      auth,
      user => {
        console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
      },
      error => {
        console.error('Auth state change error:', error);
      }
    );

    console.log('Firebase Auth initialized successfully');
    return auth;
  } catch (error) {
    console.error('Error initializing Firebase Auth:', error);
    return null;
  }
};

/**
 * Get Firebase Auth instance
 * @returns {Object|null} Firebase Auth instance or null if not initialized
 */
export const getFirebaseAuth = () => {
  if (!auth) {
    return initializeFirebaseAuth();
  }
  return auth;
};

// Initialize Firebase Auth on module load
initializeFirebaseAuth();

// Export Firebase Auth instance
export { auth };
