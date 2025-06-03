/**
 * Firebase Service Organism
 * This organism combines Firebase app, auth, and Firestore molecules
 * to provide a complete Firebase solution.
 * Integrates all Firebase functionality into a cohesive service.
 */

// External imports

// Internal imports
import { getFirebaseApp, initializeFirebaseApp } from '../atoms/firebaseApp';
import {
  getFirebaseAuth,
  initializeFirebaseAuth,
  getCurrentUser,
  signIn,
  createUser,
  logOut,
  resetPassword,
  updateUserEmail,
  updateUserPassword,
  updateUserProfile,
} from '../molecules/firebaseAuth';
import {
  getFirestoreDb,
  initializeFirestore,
  createDocument,
  getDocument,
  setDocument,
  updateDocument,
  deleteDocument,
  queryDocuments,
  subscribeToDocument,
  subscribeToQuery,
  createBatch,
  createTimestamp,
  getServerTimestamp,
  goOnline,
  goOffline,
} from '../molecules/firebaseFirestore';

/**
 * Firebase service initialization options
 *
 * @typedef {Object} FirebaseInitOptions
 * @property {boolean} enableLogging - Whether to enable logging
 * @property {boolean} enableAuthPersistence - Whether to enable Auth persistence
 * @property {boolean} enablePersistence - Whether to enable Firestore offline persistence
 */

/**
 * Initialize Firebase services
 *
 * @param {FirebaseInitOptions} options - Initialization options
 * @returns {Object} Initialization result
 */
export const initializeFirebase = (
  options = {
    enableLogging: true,
    enableAuthPersistence: true,
    enablePersistence: true,
  }
) => {
  const result = {
    success: false,
    app: null,
    auth: null,
    firestore: null,
    errors: [],
  };

  try {
    // Initialize Firebase app
    if (options.enableLogging) {
      console.log('Initializing Firebase app...');
    }

    result.app = initializeFirebaseApp();

    if (!result.app) {
      result.errors.push('Failed to initialize Firebase app');
    } else if (options.enableLogging) {
      console.log('Firebase app initialized successfully');
    }

    // Initialize Firebase Auth
    if (options.enableLogging) {
      console.log('Initializing Firebase Auth...');
    }

    result.auth = initializeFirebaseAuth();

    if (!result.auth) {
      result.errors.push('Failed to initialize Firebase Auth');
    } else if (options.enableLogging) {
      console.log('Firebase Auth initialized successfully');
    }

    // Initialize Firestore
    if (options.enableLogging) {
      console.log('Initializing Firestore...');
    }

    result.firestore = initializeFirestore({
      enablePersistence: options.enablePersistence,
    });

    if (!result.firestore) {
      result.errors.push('Failed to initialize Firestore');
    } else if (options.enableLogging) {
      console.log('Firestore initialized successfully');
    }

    // Set overall success status
    result.success = result.app && result.auth && result.firestore;

    if (options.enableLogging) {
      if (result.success) {
        console.log('Firebase services initialized successfully');
      } else {
        console.error('Firebase services initialization failed:', result.errors);
      }
    }

    return result;
  } catch (error) {
    result.success = false;
    result.errors.push(`Unexpected error: ${error.message}`);

    if (options.enableLogging) {
      console.error('Firebase services initialization failed:', error);
    }

    return result;
  }
};

// Core auth functions
export const auth = {
  getCurrentUser,
  signIn,
  createUser,
  logOut,
  resetPassword,
  updateUserEmail,
  updateUserPassword,
  updateUserProfile,

  /**
   * Get user ID
   *
   * @returns {string|null} User ID or null if not authenticated
   */
  getUserId: () => {
    const user = getCurrentUser();
    return user ? user.uid : null;
  },

  /**
   * Get user email
   *
   * @returns {string|null} User email or null if not authenticated
   */
  getUserEmail: () => {
    const user = getCurrentUser();
    return user ? user.email : null;
  },

  /**
   * Get user display name
   *
   * @returns {string|null} User display name or null if not authenticated
   */
  getUserDisplayName: () => {
    const user = getCurrentUser();
    return user ? user.displayName : null;
  },

  /**
   * Get user photo URL
   *
   * @returns {string|null} User photo URL or null if not authenticated
   */
  getUserPhotoUrl: () => {
    const user = getCurrentUser();
    return user ? user.photoURL : null;
  },

  /**
   * Check if user is authenticated
   *
   * @returns {boolean} Whether user is authenticated
   */
  isAuthenticated: () => {
    return !!getCurrentUser();
  },
};

// Core Firestore functions
export const firestore = {
  createDocument,
  getDocument,
  setDocument,
  updateDocument,
  deleteDocument,
  queryDocuments,
  subscribeToDocument,
  subscribeToQuery,
  createBatch,
  createTimestamp,
  getServerTimestamp,
  goOnline,
  goOffline,

  /**
   * Get all documents in a collection
   *
   * @param {string} collectionPath - Collection path
   * @returns {Promise<Array>} Documents
   */
  getAllDocuments: async collectionPath => {
    return queryDocuments(collectionPath);
  },

  /**
   * Get documents by field value
   *
   * @param {string} collectionPath - Collection path
   * @param {string} field - Field name
   * @param {any} value - Field value
   * @returns {Promise<Array>} Documents
   */
  getDocumentsByField: async (collectionPath, field, value) => {
    return queryDocuments(collectionPath, [[field, '==', value]]);
  },

  /**
   * Get documents created by current user
   *
   * @param {string} collectionPath - Collection path
   * @param {string} userIdField - User ID field name
   * @returns {Promise<Array>} Documents
   */
  getUserDocuments: async (collectionPath, userIdField = 'userId') => {
    const userId = auth.getUserId();
    if (!userId) {
      return [];
    }
    return queryDocuments(collectionPath, [[userIdField, '==', userId]]);
  },

  /**
   * Create a document with user ID
   *
   * @param {string} collectionPath - Collection path
   * @param {Object} data - Document data
   * @param {string} userIdField - User ID field name
   * @returns {Promise<string>} Document ID
   */
  createUserDocument: async (collectionPath, data, userIdField = 'userId') => {
    const userId = auth.getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }
    const documentData = {
      ...data,
      [userIdField]: userId,
    };
    return createDocument(collectionPath, documentData);
  },
};

// Firebase services
export const firebase = {
  initialize: initializeFirebase,
  getApp: getFirebaseApp,
  getAuth: getFirebaseAuth,
  getFirestore: getFirestoreDb,
  auth,
  firestore,
};

export default firebase;
