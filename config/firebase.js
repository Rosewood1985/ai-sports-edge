/**
 * Firebase configuration for AI Sports Edge
 * Mock version for testing
 * Using atomic architecture
 */

// Import the consolidated Firebase service
// Note: In a real implementation, this would be properly imported
// For testing purposes, we're creating a mock that matches the structure
const firebaseService = {
  // Firestore mock that matches the atomic architecture structure
  firestore: {
    collection: () => {},
    query: () => {},
    where: () => {},
    orderBy: () => {},
    limit: () => {},
    getDocument: () => {},
    setDocument: () => {},
    updateDocument: () => {},
    deleteDocument: () => {},
    getCollection: () => {},
    doc: () => {},
    Timestamp: {
      now: () => ({})
    },
    serverTimestamp: () => ({})
  }
};

module.exports = {
  firebaseService,
  // Legacy export for backward compatibility
  firestore: firebaseService.firestore
};