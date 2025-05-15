import { getFirestore } from 'firebase/firestore';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  serverTimestamp,
  onSnapshot,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import firebaseApp from '../atoms/firebaseApp';

/**
 * Firebase Firestore Molecule
 * Provides Firestore database functionality
 */

// Initialize Firestore
const firestore = getFirestore(firebaseApp);

/**
 * Get a document from Firestore
 * @param collectionName Collection name
 * @param docId Document ID
 * @returns Promise resolving to document data or null
 */
const getDocument = async <T>(collectionName: string, docId: string): Promise<T | null> => {
  try {
    const docRef = doc(firestore, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    }
    return null;
  } catch (error) {
    console.error(`Error getting document ${docId}:`, error);
    throw error;
  }
};

/**
 * Set a document in Firestore
 * @param collectionName Collection name
 * @param docId Document ID
 * @param data Document data
 */
const setDocument = async <T>(collectionName: string, docId: string, data: T): Promise<void> => {
  try {
    const docRef = doc(firestore, collectionName, docId);
    await setDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Error setting document ${docId}:`, error);
    throw error;
  }
};

/**
 * Update a document in Firestore
 * @param collectionName Collection name
 * @param docId Document ID
 * @param data Document data (partial)
 */
const updateDocument = async <T>(collectionName: string, docId: string, data: Partial<T>): Promise<void> => {
  try {
    const docRef = doc(firestore, collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Error updating document ${docId}:`, error);
    throw error;
  }
};

/**
 * Delete a document from Firestore
 * @param collectionName Collection name
 * @param docId Document ID
 */
const deleteDocument = async (collectionName: string, docId: string): Promise<void> => {
  try {
    const docRef = doc(firestore, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document ${docId}:`, error);
    throw error;
  }
};

/**
 * Get documents from a collection with optional query
 * @param collectionName Collection name
 * @param queryConstraints Query constraints (optional)
 * @returns Promise resolving to array of documents
 */
const getCollection = async <T>(
  collectionName: string, 
  queryConstraints: any[] = []
): Promise<T[]> => {
  try {
    const collectionRef = collection(firestore, collectionName);
    const q = query(collectionRef, ...queryConstraints);
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as T[];
  } catch (error) {
    console.error(`Error getting collection ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Subscribe to a document
 * @param collectionName Collection name
 * @param docId Document ID
 * @param callback Callback function
 * @returns Unsubscribe function
 */
const subscribeToDocument = <T>(
  collectionName: string, 
  docId: string, 
  callback: (data: T | null) => void
): (() => void) => {
  const docRef = doc(firestore, collectionName, docId);
  
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() } as T);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error(`Error subscribing to document ${docId}:`, error);
    callback(null);
  });
};

/**
 * Subscribe to a collection
 * @param collectionName Collection name
 * @param callback Callback function
 * @param queryConstraints Query constraints (optional)
 * @returns Unsubscribe function
 */
const subscribeToCollection = <T>(
  collectionName: string, 
  callback: (data: T[]) => void,
  queryConstraints: any[] = []
): (() => void) => {
  const collectionRef = collection(firestore, collectionName);
  const q = query(collectionRef, ...queryConstraints);
  
  return onSnapshot(q, (querySnapshot) => {
    const documents = querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as T[];
    
    callback(documents);
  }, (error) => {
    console.error(`Error subscribing to collection ${collectionName}:`, error);
    callback([]);
  });
};

/**
 * Create a batch write operation
 * @returns Batch instance
 */
const createBatch = () => {
  return writeBatch(firestore);
};

export {
  firestore,
  getDocument,
  setDocument,
  updateDocument,
  deleteDocument,
  getCollection,
  subscribeToDocument,
  subscribeToCollection,
  createBatch,
  serverTimestamp,
  Timestamp,
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  startAfter
};