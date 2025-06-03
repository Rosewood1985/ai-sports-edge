// Firebase Module Index
// Provides a clean interface for importing Firebase services

// Export Firebase configuration and initialized services
// Import and re-export for backward compatibility with existing code
import * as authModule from './auth';
import * as firestoreModule from './firestore';

export * from './config';

// Export authentication methods
export * from './auth';

// Export Firestore methods
export * from './firestore';

// Export examples (for development and reference only)
export * as examples from './examples';

export const firebase = {
  auth: authModule,
  firestore: firestoreModule,
  // Add other Firebase modules here as they're created
};
