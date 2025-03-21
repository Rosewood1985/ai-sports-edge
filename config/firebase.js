/**
 * Firebase configuration for AI Sports Edge
 * Mock version for testing
 */

// Mock firestore for testing
const firestore = {
  collection: () => {},
  query: () => {},
  where: () => {},
  orderBy: () => {},
  limit: () => {},
  getDocs: () => {},
  addDoc: () => {},
  doc: () => {},
  updateDoc: () => {},
  deleteDoc: () => {}
};

module.exports = {
  firestore
};