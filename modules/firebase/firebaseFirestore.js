/**
 * Firebase Firestore
 * 
 * Provides Firebase Firestore database functionality.
 */

import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { firebaseApp, getFirebaseApp } from "./firebaseConfig";

let db = null;

/**
 * Initialize Firebase Firestore
 * @param {Object} options - Firestore initialization options
 * @param {boolean} options.enablePersistence - Whether to enable offline persistence
 * @returns {Object|null} Firebase Firestore instance or null if initialization failed
 */
export const initializeFirestore = (options = { enablePersistence: true }) => {
  try {
    // Get Firebase app instance
    const app = getFirebaseApp();
    if (!app) {
      console.error('Firestore initialization failed: Firebase app not initialized');
      return null;
    }

    // Initialize Firestore
    db = getFirestore(app);

    // Enable offline persistence if requested
    if (options.enablePersistence) {
      enableIndexedDbPersistence(db)
        .then(() => {
          console.log('Firestore persistence enabled successfully');
        })
        .catch((error) => {
          if (error.code === 'failed-precondition') {
            console.warn(
              'Firestore persistence could not be enabled: Multiple tabs open. ' +
              'Persistence can only be enabled in one tab at a time.'
            );
          } else if (error.code === 'unimplemented') {
            console.warn(
              'Firestore persistence could not be enabled: The current browser does not support all of the features required to enable persistence.'
            );
          } else {
            console.error('Error enabling Firestore persistence:', error);
          }
        });
    }

    console.log('Firestore initialized successfully');
    return db;
  } catch (error) {
    console.error('Error initializing Firestore:', error);
    return null;
  }
};

/**
 * Get Firebase Firestore instance
 * @returns {Object|null} Firebase Firestore instance or null if not initialized
 */
export const getFirestore = () => {
  if (!db) {
    return initializeFirestore();
  }
  return db;
};

// Initialize Firestore on module load
initializeFirestore();

// Export Firestore instance
export { db };