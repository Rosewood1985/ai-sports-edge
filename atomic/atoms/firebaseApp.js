/**
 * Firebase App Atom
 * Provides the core Firebase app initialization functionality.
 * This is a fundamental building block for Firebase services.
 */

// External imports
import { initializeApp } from 'firebase/app';

// Internal imports
import { firebaseConfig } from './serviceConfig';
import { validateConfig } from './envConfig';

// Firebase app instance (singleton)
let firebaseApp = null;

/**
 * Initialize Firebase app
 * 
 * @param {Object} config - Firebase configuration object (optional, uses default if not provided)
 * @returns {Object|null} Firebase app instance or null if initialization failed
 */
export const initializeFirebaseApp = (config = firebaseConfig) => {
  try {
    // Validate required config values
    if (validateConfig(config, ['apiKey', 'authDomain', 'projectId'])) {
      const app = initializeApp(config);
      console.log('Firebase app initialized successfully');
      return app;
    } else {
      console.error('Firebase initialization skipped due to missing configuration');
      return null;
    }
  } catch (error) {
    console.error('Error initializing Firebase app:', error);
    return null;
  }
};

/**
 * Get Firebase app instance
 * Initializes the app if it hasn't been initialized yet
 * 
 * @returns {Object|null} Firebase app instance or null if initialization failed
 */
export const getFirebaseApp = () => {
  if (!firebaseApp) {
    firebaseApp = initializeFirebaseApp();
  }
  return firebaseApp;
};

/**
 * Reset Firebase app instance
 * Useful for testing or when configuration changes
 */
export const resetFirebaseApp = () => {
  firebaseApp = null;
};

// Export Firebase app instance
export { firebaseApp };
