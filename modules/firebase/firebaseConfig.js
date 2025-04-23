/**
 * Firebase Configuration
 * 
 * Initializes Firebase app and exports the app instance.
 */

import { initializeApp } from "firebase/app";
import { firebaseConfig, validateConfig } from "../environment/envConfig";

let app = null;

/**
 * Initialize Firebase app
 * @returns {Object|null} Firebase app instance or null if initialization failed
 */
export const initializeFirebaseApp = () => {
  try {
    // Validate required config values
    if (validateConfig(firebaseConfig, ['apiKey', 'authDomain', 'projectId'])) {
      app = initializeApp(firebaseConfig);
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
 * @returns {Object|null} Firebase app instance or null if not initialized
 */
export const getFirebaseApp = () => {
  if (!app) {
    return initializeFirebaseApp();
  }
  return app;
};

// Initialize Firebase app on module load
initializeFirebaseApp();

// Export Firebase app instance
export { app as firebaseApp };