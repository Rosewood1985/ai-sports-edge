/**
 * Firebase Firestore Molecule
 * Provides Firebase Firestore database functionality.
 * Combines the Firebase app atom with Firestore-specific features.
 */

// External imports
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
  enableIndexedDbPersistence,
  enableNetwork,
  disableNetwork,
} from 'firebase/firestore';

// Internal imports
import { getFirebaseApp } from '../atoms/firebaseApp';

// Firebase Firestore instance (singleton)
let db = null;

/**
 * Initialize Firebase Firestore
 *
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
        .catch(error => {
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
 * Initializes Firestore if it hasn't been initialized yet
 *
 * @returns {Object|null} Firebase Firestore instance or null if initialization failed
 */
export const getFirestoreDb = () => {
  if (!db) {
    return initializeFirestore();
  }
  return db;
};

/**
 * Create a document in a collection
 *
 * @param {string} collectionPath - Collection path
 * @param {Object} data - Document data
 * @param {Object} options - Options
 * @param {boolean} options.addTimestamp - Whether to add a timestamp
 * @returns {Promise<string>} Document ID
 */
export const createDocument = async (collectionPath, data, options = { addTimestamp: true }) => {
  try {
    const dbInstance = getFirestoreDb();

    if (!dbInstance) {
      throw new Error('Firestore not initialized');
    }

    const documentData = { ...data };

    if (options.addTimestamp) {
      documentData.createdAt = serverTimestamp();
      documentData.updatedAt = serverTimestamp();
    }

    const docRef = await addDoc(collection(dbInstance, collectionPath), documentData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
};

/**
 * Set a document with a specific ID
 *
 * @param {string} collectionPath - Collection path
 * @param {string} documentId - Document ID
 * @param {Object} data - Document data
 * @param {Object} options - Options
 * @param {boolean} options.merge - Whether to merge with existing data
 * @param {boolean} options.addTimestamp - Whether to add a timestamp
 * @returns {Promise<void>}
 */
export const setDocument = async (
  collectionPath,
  documentId,
  data,
  options = { merge: true, addTimestamp: true }
) => {
  try {
    const dbInstance = getFirestoreDb();

    if (!dbInstance) {
      throw new Error('Firestore not initialized');
    }

    const documentData = { ...data };

    if (options.addTimestamp) {
      if (!documentData.createdAt) {
        documentData.createdAt = serverTimestamp();
      }
      documentData.updatedAt = serverTimestamp();
    }

    await setDoc(doc(dbInstance, collectionPath, documentId), documentData, {
      merge: options.merge,
    });
  } catch (error) {
    console.error('Error setting document:', error);
    throw error;
  }
};

/**
 * Update a document
 *
 * @param {string} collectionPath - Collection path
 * @param {string} documentId - Document ID
 * @param {Object} data - Document data
 * @param {Object} options - Options
 * @param {boolean} options.addTimestamp - Whether to add a timestamp
 * @returns {Promise<void>}
 */
export const updateDocument = async (
  collectionPath,
  documentId,
  data,
  options = { addTimestamp: true }
) => {
  try {
    const dbInstance = getFirestoreDb();

    if (!dbInstance) {
      throw new Error('Firestore not initialized');
    }

    const documentData = { ...data };

    if (options.addTimestamp) {
      documentData.updatedAt = serverTimestamp();
    }

    await updateDoc(doc(dbInstance, collectionPath, documentId), documentData);
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
};

/**
 * Delete a document
 *
 * @param {string} collectionPath - Collection path
 * @param {string} documentId - Document ID
 * @returns {Promise<void>}
 */
export const deleteDocument = async (collectionPath, documentId) => {
  try {
    const dbInstance = getFirestoreDb();

    if (!dbInstance) {
      throw new Error('Firestore not initialized');
    }

    await deleteDoc(doc(dbInstance, collectionPath, documentId));
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

/**
 * Get a document
 *
 * @param {string} collectionPath - Collection path
 * @param {string} documentId - Document ID
 * @returns {Promise<Object|null>} Document data or null if not found
 */
export const getDocument = async (collectionPath, documentId) => {
  try {
    const dbInstance = getFirestoreDb();

    if (!dbInstance) {
      throw new Error('Firestore not initialized');
    }

    const docSnap = await getDoc(doc(dbInstance, collectionPath, documentId));

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting document:', error);
    throw error;
  }
};

/**
 * Query documents
 *
 * @param {string} collectionPath - Collection path
 * @param {Array} conditions - Query conditions
 * @param {Array} orderByFields - Order by fields
 * @param {number} limitCount - Limit count
 * @param {Object} startAfterDoc - Start after document
 * @returns {Promise<Array>} Documents
 */
export const queryDocuments = async (
  collectionPath,
  conditions = [],
  orderByFields = [],
  limitCount = 0,
  startAfterDoc = null
) => {
  try {
    const dbInstance = getFirestoreDb();

    if (!dbInstance) {
      throw new Error('Firestore not initialized');
    }

    let q = collection(dbInstance, collectionPath);

    // Apply conditions
    if (conditions.length > 0) {
      const queryConstraints = conditions.map(condition => {
        const [field, operator, value] = condition;
        return where(field, operator, value);
      });

      q = query(q, ...queryConstraints);
    }

    // Apply order by
    if (orderByFields.length > 0) {
      const orderByConstraints = orderByFields.map(field => {
        if (typeof field === 'string') {
          return orderBy(field);
        } else {
          const [fieldName, direction] = field;
          return orderBy(fieldName, direction);
        }
      });

      q = query(q, ...orderByConstraints);
    }

    // Apply start after
    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc));
    }

    // Apply limit
    if (limitCount > 0) {
      q = query(q, limit(limitCount));
    }

    const querySnapshot = await getDocs(q);
    const documents = [];

    querySnapshot.forEach(doc => {
      documents.push({ id: doc.id, ...doc.data() });
    });

    return documents;
  } catch (error) {
    console.error('Error querying documents:', error);
    throw error;
  }
};

/**
 * Subscribe to document changes
 *
 * @param {string} collectionPath - Collection path
 * @param {string} documentId - Document ID
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const subscribeToDocument = (collectionPath, documentId, callback) => {
  try {
    const dbInstance = getFirestoreDb();

    if (!dbInstance) {
      throw new Error('Firestore not initialized');
    }

    const unsubscribe = onSnapshot(
      doc(dbInstance, collectionPath, documentId),
      docSnapshot => {
        if (docSnapshot.exists()) {
          callback({ id: docSnapshot.id, ...docSnapshot.data() });
        } else {
          callback(null);
        }
      },
      error => {
        console.error('Error subscribing to document:', error);
        callback(null, error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up document subscription:', error);
    throw error;
  }
};

/**
 * Subscribe to query changes
 *
 * @param {string} collectionPath - Collection path
 * @param {Array} conditions - Query conditions
 * @param {Array} orderByFields - Order by fields
 * @param {number} limitCount - Limit count
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const subscribeToQuery = (
  collectionPath,
  conditions = [],
  orderByFields = [],
  limitCount = 0,
  callback
) => {
  try {
    const dbInstance = getFirestoreDb();

    if (!dbInstance) {
      throw new Error('Firestore not initialized');
    }

    let q = collection(dbInstance, collectionPath);

    // Apply conditions
    if (conditions.length > 0) {
      const queryConstraints = conditions.map(condition => {
        const [field, operator, value] = condition;
        return where(field, operator, value);
      });

      q = query(q, ...queryConstraints);
    }

    // Apply order by
    if (orderByFields.length > 0) {
      const orderByConstraints = orderByFields.map(field => {
        if (typeof field === 'string') {
          return orderBy(field);
        } else {
          const [fieldName, direction] = field;
          return orderBy(fieldName, direction);
        }
      });

      q = query(q, ...orderByConstraints);
    }

    // Apply limit
    if (limitCount > 0) {
      q = query(q, limit(limitCount));
    }

    const unsubscribe = onSnapshot(
      q,
      querySnapshot => {
        const documents = [];

        querySnapshot.forEach(doc => {
          documents.push({ id: doc.id, ...doc.data() });
        });

        callback(documents);
      },
      error => {
        console.error('Error subscribing to query:', error);
        callback([], error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up query subscription:', error);
    throw error;
  }
};

/**
 * Create a batch write operation
 *
 * @returns {Object} Batch write object
 */
export const createBatch = () => {
  const dbInstance = getFirestoreDb();

  if (!dbInstance) {
    throw new Error('Firestore not initialized');
  }

  return writeBatch(dbInstance);
};

/**
 * Get server timestamp
 *
 * @returns {Object} Server timestamp
 */
export const getServerTimestamp = () => {
  return serverTimestamp();
};

/**
 * Create a timestamp from date
 *
 * @param {Date} date - Date
 * @returns {Object} Timestamp
 */
export const createTimestamp = date => {
  return Timestamp.fromDate(date);
};

/**
 * Enable network (work online)
 *
 * @returns {Promise<void>}
 */
export const goOnline = async () => {
  try {
    const dbInstance = getFirestoreDb();

    if (!dbInstance) {
      throw new Error('Firestore not initialized');
    }

    await enableNetwork(dbInstance);
    console.log('Firestore network enabled');
  } catch (error) {
    console.error('Error enabling Firestore network:', error);
    throw error;
  }
};

/**
 * Disable network (work offline)
 *
 * @returns {Promise<void>}
 */
export const goOffline = async () => {
  try {
    const dbInstance = getFirestoreDb();

    if (!dbInstance) {
      throw new Error('Firestore not initialized');
    }

    await disableNetwork(dbInstance);
    console.log('Firestore network disabled');
  } catch (error) {
    console.error('Error disabling Firestore network:', error);
    throw error;
  }
};

// Initialize Firestore on module load
initializeFirestore();

// Export Firestore instance
export { db };
