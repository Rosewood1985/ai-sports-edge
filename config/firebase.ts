import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// Load environment variables
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  
  // For Expo/React Native
  if (typeof global !== 'undefined') {
    // Use type assertion for global
    const globalAny = global as any;
    if (globalAny.__expo && globalAny.__expo.Constants) {
      const expoConstants = globalAny.__expo.Constants;
      return expoConstants.manifest?.extra?.[key] || defaultValue;
    }
  }
  
  return defaultValue;
};

// Firebase configuration
const firebaseConfig = {
  apiKey: getEnvVar('FIREBASE_API_KEY'),
  authDomain: getEnvVar('FIREBASE_AUTH_DOMAIN', 'ai-sports-edge.firebaseapp.com'),
  projectId: getEnvVar('FIREBASE_PROJECT_ID', 'ai-sports-edge'),
  storageBucket: getEnvVar('FIREBASE_STORAGE_BUCKET', 'ai-sports-edge.appspot.com'),
  messagingSenderId: getEnvVar('FIREBASE_MESSAGING_SENDER_ID', '123456789012'),
  appId: getEnvVar('FIREBASE_APP_ID', '1:123456789012:web:abcdef1234567890'),
  measurementId: getEnvVar('FIREBASE_MEASUREMENT_ID', 'G-ABCDEFGHIJ')
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const firestore = getFirestore(app);
const functions = getFunctions(app);

export { app, auth, firestore, functions };