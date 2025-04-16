/**
 * Firebase Configuration
 * 
 * This file provides Firebase configuration for different environments.
 * It automatically selects the appropriate configuration based on the environment.
 */

// Production Firebase configuration
const productionConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "YOUR_PRODUCTION_API_KEY",
  authDomain: "ai-sports-edge-prod.firebaseapp.com",
  databaseURL: "https://ai-sports-edge-prod.firebaseio.com",
  projectId: "ai-sports-edge-prod",
  storageBucket: "ai-sports-edge-prod.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890",
  measurementId: "G-ABCDEF1234"
};

// Staging Firebase configuration
const stagingConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "YOUR_STAGING_API_KEY",
  authDomain: "ai-sports-edge-staging.firebaseapp.com",
  databaseURL: "https://ai-sports-edge-staging.firebaseio.com",
  projectId: "ai-sports-edge-staging",
  storageBucket: "ai-sports-edge-staging.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890",
  measurementId: "G-ABCDEF1234"
};

// Development Firebase configuration
const developmentConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "YOUR_DEVELOPMENT_API_KEY",
  authDomain: "ai-sports-edge-dev.firebaseapp.com",
  databaseURL: "https://ai-sports-edge-dev.firebaseio.com",
  projectId: "ai-sports-edge-dev",
  storageBucket: "ai-sports-edge-dev.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890",
  measurementId: "G-ABCDEF1234"
};

// Local emulator configuration
const localEmulatorConfig = {
  apiKey: "fake-api-key",
  authDomain: "localhost",
  databaseURL: "http://localhost:9000?ns=ai-sports-edge-local",
  projectId: "ai-sports-edge-local",
  storageBucket: "ai-sports-edge-local.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:0000000000000000",
  measurementId: "G-0000000000"
};

/**
 * Get Firebase configuration based on environment
 * 
 * @returns {Object} Firebase configuration
 */
const getFirebaseConfig = () => {
  // Check if we're using the local emulator
  if (process.env.REACT_APP_USE_FIREBASE_EMULATOR === 'true') {
    console.log('Using Firebase Local Emulator');
    return localEmulatorConfig;
  }
  
  // Check environment
  switch (process.env.REACT_APP_ENV || process.env.NODE_ENV) {
    case 'production':
      console.log('Using Firebase Production Environment');
      return productionConfig;
    case 'staging':
      console.log('Using Firebase Staging Environment');
      return stagingConfig;
    case 'development':
    case 'dev':
      console.log('Using Firebase Development Environment');
      return developmentConfig;
    default:
      console.log('Environment not specified, defaulting to Development');
      return developmentConfig;
  }
};

/**
 * Configure Firebase emulators
 * 
 * @param {Object} firebase - Firebase instance
 */
const configureEmulators = (firebase) => {
  if (process.env.REACT_APP_USE_FIREBASE_EMULATOR === 'true') {
    // Connect to local emulators
    firebase.auth().useEmulator('http://localhost:9099');
    firebase.firestore().useEmulator('localhost', 8080);
    firebase.functions().useEmulator('localhost', 5001);
    firebase.database().useEmulator('localhost', 9000);
    firebase.storage().useEmulator('localhost', 9199);
    
    console.log('Connected to Firebase emulators');
  }
};

/**
 * Initialize Firebase with appropriate scaling for production
 * 
 * @param {Object} firebase - Firebase instance
 */
const initializeFirebaseWithScaling = (firebase) => {
  // Initialize Firebase
  firebase.initializeApp(getFirebaseConfig());
  
  // Configure emulators if needed
  configureEmulators(firebase);
  
  // Initialize Analytics in production
  if (process.env.REACT_APP_ENV === 'production' || process.env.NODE_ENV === 'production') {
    firebase.analytics();
  }
  
  // Configure Firestore for production scaling
  if (process.env.REACT_APP_ENV === 'production' || process.env.NODE_ENV === 'production') {
    // Enable offline persistence with appropriate cache size
    firebase.firestore().settings({
      cacheSizeBytes: 100000000, // 100MB
      ignoreUndefinedProperties: true,
    });
    
    // Enable offline persistence
    firebase.firestore().enablePersistence({
      synchronizeTabs: true
    }).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
      } else if (err.code === 'unimplemented') {
        console.warn('The current browser does not support all of the features required to enable persistence.');
      }
    });
    
    // Configure performance monitoring
    firebase.performance();
  }
  
  return firebase;
};

export { getFirebaseConfig, configureEmulators, initializeFirebaseWithScaling };