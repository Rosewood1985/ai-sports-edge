import { firebaseAuth, firebaseFirestore, firebaseStorage, firebaseFunctions, firebaseAnalytics } from '../molecules';
import firebaseApp from '../atoms/firebaseApp';

/**
 * Firebase Service Organism
 * 
 * Consolidated service for all Firebase interactions
 * Combines all Firebase molecules into a single service
 */
export const firebaseService = {
  // Core Firebase app
  app: firebaseApp,
  
  // Auth services
  auth: {
    instance: firebaseAuth.auth,
    signIn: firebaseAuth.signIn,
    signUp: firebaseAuth.signUp,
    signOut: firebaseAuth.logOut,
    resetPassword: firebaseAuth.resetPassword,
    onAuthStateChange: firebaseAuth.onAuthStateChange,
    signInWithGoogle: firebaseAuth.signInWithGoogle,
    signInWithFacebook: firebaseAuth.signInWithFacebook,
    signInWithTwitter: firebaseAuth.signInWithTwitter,
    updateProfile: firebaseAuth.updateUserProfile,
    verifyEmail: firebaseAuth.verifyEmail
  },
  
  // Firestore services
  firestore: {
    instance: firebaseFirestore.firestore,
    getDocument: firebaseFirestore.getDocument,
    setDocument: firebaseFirestore.setDocument,
    updateDocument: firebaseFirestore.updateDocument,
    deleteDocument: firebaseFirestore.deleteDocument,
    getCollection: firebaseFirestore.getCollection,
    subscribeToDocument: firebaseFirestore.subscribeToDocument,
    subscribeToCollection: firebaseFirestore.subscribeToCollection,
    createBatch: firebaseFirestore.createBatch,
    serverTimestamp: firebaseFirestore.serverTimestamp,
    Timestamp: firebaseFirestore.Timestamp,
    // Query helpers
    collection: firebaseFirestore.collection,
    doc: firebaseFirestore.doc,
    query: firebaseFirestore.query,
    where: firebaseFirestore.where,
    orderBy: firebaseFirestore.orderBy,
    limit: firebaseFirestore.limit,
    startAfter: firebaseFirestore.startAfter
  },
  
  // Storage services
  storage: {
    instance: firebaseStorage.storage,
    uploadFile: firebaseStorage.uploadFile,
    uploadFileWithProgress: firebaseStorage.uploadFileWithProgress,
    getFileUrl: firebaseStorage.getFileUrl,
    deleteFile: firebaseStorage.deleteFile,
    listFiles: firebaseStorage.listFiles,
    ref: firebaseStorage.ref
  },
  
  // Functions services
  functions: {
    instance: firebaseFunctions.functions,
    callFunction: firebaseFunctions.callFunction
  },
  
  // Analytics services
  analytics: {
    instance: firebaseAnalytics.analytics,
    logEvent: firebaseAnalytics.logAnalyticsEvent,
    setUserProperties: firebaseAnalytics.setUserAnalyticsProperties,
    events: firebaseAnalytics.AnalyticsEvents
  }
};

export default firebaseService;