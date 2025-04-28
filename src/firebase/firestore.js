// Firebase Firestore Module
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp
} from "firebase/firestore";
import { firestore } from "./config";

/**
 * Create a document in a collection
 * @param {string} collectionName - The name of the collection
 * @param {object} data - The data to store
 * @returns {Promise<object>} - The document reference and ID
 */
export const createDocument = async (collectionName, data) => {
  try {
    const collectionRef = collection(firestore, collectionName);
    const docRef = await addDoc(collectionRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { 
      id: docRef.id, 
      ref: docRef,
      error: null 
    };
  } catch (error) {
    console.error(`Error creating document in ${collectionName}:`, error);
    return { 
      id: null, 
      ref: null, 
      error: error.message 
    };
  }
};

/**
 * Create a document with a specific ID
 * @param {string} collectionName - The name of the collection
 * @param {string} documentId - The ID for the document
 * @param {object} data - The data to store
 * @returns {Promise<object>} - Success/error status
 */
export const createDocumentWithId = async (collectionName, documentId, data) => {
  try {
    const docRef = doc(firestore, collectionName, documentId);
    await setDoc(docRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { 
      id: documentId, 
      ref: docRef,
      error: null 
    };
  } catch (error) {
    console.error(`Error creating document with ID in ${collectionName}:`, error);
    return { 
      id: null, 
      ref: null, 
      error: error.message 
    };
  }
};

/**
 * Get a document by ID
 * @param {string} collectionName - The name of the collection
 * @param {string} documentId - The ID of the document
 * @returns {Promise<object>} - The document data
 */
export const getDocument = async (collectionName, documentId) => {
  try {
    const docRef = doc(firestore, collectionName, documentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { 
        id: documentId,
        data: { id: documentId, ...docSnap.data() },
        exists: true,
        error: null 
      };
    } else {
      return { 
        id: documentId,
        data: null,
        exists: false,
        error: null 
      };
    }
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    return { 
      id: documentId,
      data: null,
      exists: false,
      error: error.message 
    };
  }
};

/**
 * Update a document
 * @param {string} collectionName - The name of the collection
 * @param {string} documentId - The ID of the document
 * @param {object} data - The data to update
 * @returns {Promise<object>} - Success/error status
 */
export const updateDocument = async (collectionName, documentId, data) => {
  try {
    const docRef = doc(firestore, collectionName, documentId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    
    return { success: true, error: null };
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a document
 * @param {string} collectionName - The name of the collection
 * @param {string} documentId - The ID of the document
 * @returns {Promise<object>} - Success/error status
 */
export const deleteDocument = async (collectionName, documentId) => {
  try {
    const docRef = doc(firestore, collectionName, documentId);
    await deleteDoc(docRef);
    
    return { success: true, error: null };
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Query documents in a collection
 * @param {string} collectionName - The name of the collection
 * @param {Array} conditions - Array of condition objects: { field, operator, value }
 * @param {Array} orderByFields - Array of objects: { field, direction }
 * @param {number} limitCount - Number of documents to limit to
 * @param {object} startAfterDoc - Document to start after for pagination
 * @returns {Promise<Array>} - Array of documents
 */
export const queryDocuments = async (
  collectionName, 
  conditions = [], 
  orderByFields = [], 
  limitCount = 0,
  startAfterDoc = null
) => {
  try {
    let collectionRef = collection(firestore, collectionName);
    let queryConstraints = [];
    
    // Add where conditions
    conditions.forEach(condition => {
      queryConstraints.push(where(condition.field, condition.operator, condition.value));
    });
    
    // Add orderBy
    orderByFields.forEach(order => {
      queryConstraints.push(orderBy(order.field, order.direction || 'asc'));
    });
    
    // Add limit
    if (limitCount > 0) {
      queryConstraints.push(limit(limitCount));
    }
    
    // Add startAfter for pagination
    if (startAfterDoc) {
      queryConstraints.push(startAfter(startAfterDoc));
    }
    
    const q = query(collectionRef, ...queryConstraints);
    const querySnapshot = await getDocs(q);
    
    const documents = [];
    querySnapshot.forEach(doc => {
      documents.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { 
      documents, 
      count: documents.length,
      error: null 
    };
  } catch (error) {
    console.error(`Error querying documents in ${collectionName}:`, error);
    return { 
      documents: [], 
      count: 0,
      error: error.message 
    };
  }
};

/**
 * Subscribe to real-time updates on a document
 * @param {string} collectionName - The name of the collection
 * @param {string} documentId - The ID of the document
 * @param {function} callback - Function to call with updated data
 * @returns {function} - Unsubscribe function
 */
export const subscribeToDocument = (collectionName, documentId, callback) => {
  const docRef = doc(firestore, collectionName, documentId);
  
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback({ 
        id: documentId, 
        data: { id: documentId, ...doc.data() },
        exists: true,
        error: null 
      });
    } else {
      callback({ 
        id: documentId, 
        data: null,
        exists: false,
        error: null 
      });
    }
  }, (error) => {
    console.error(`Error subscribing to document in ${collectionName}:`, error);
    callback({ 
      id: documentId, 
      data: null,
      exists: false,
      error: error.message 
    });
  });
};

/**
 * Subscribe to real-time updates on a query
 * @param {string} collectionName - The name of the collection
 * @param {Array} conditions - Array of condition objects: { field, operator, value }
 * @param {Array} orderByFields - Array of objects: { field, direction }
 * @param {number} limitCount - Number of documents to limit to
 * @param {function} callback - Function to call with updated data
 * @returns {function} - Unsubscribe function
 */
export const subscribeToQuery = (
  collectionName, 
  conditions = [], 
  orderByFields = [], 
  limitCount = 0,
  callback
) => {
  let collectionRef = collection(firestore, collectionName);
  let queryConstraints = [];
  
  // Add where conditions
  conditions.forEach(condition => {
    queryConstraints.push(where(condition.field, condition.operator, condition.value));
  });
  
  // Add orderBy
  orderByFields.forEach(order => {
    queryConstraints.push(orderBy(order.field, order.direction || 'asc'));
  });
  
  // Add limit
  if (limitCount > 0) {
    queryConstraints.push(limit(limitCount));
  }
  
  const q = query(collectionRef, ...queryConstraints);
  
  return onSnapshot(q, (querySnapshot) => {
    const documents = [];
    querySnapshot.forEach(doc => {
      documents.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    callback({ 
      documents, 
      count: documents.length,
      error: null 
    });
  }, (error) => {
    console.error(`Error subscribing to query in ${collectionName}:`, error);
    callback({ 
      documents: [], 
      count: 0,
      error: error.message 
    });
  });
};

// Helper to get a timestamp
export const getServerTimestamp = () => serverTimestamp();

export { firestore };