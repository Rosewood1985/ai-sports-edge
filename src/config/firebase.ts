import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getAnalytics } from 'firebase/analytics';

// Get environment variables
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  // In a real app, this would use process.env or another method
  // For now, we'll use a simple implementation
  const envVars: Record<string, string> = {
    FIREBASE_API_KEY: 'G-52JHSJCWN',
    FIREBASE_AUTH_DOMAIN: 'ai-sports-edge.firebaseapp.com',
    FIREBASE_PROJECT_ID: 'ai-sports-edge',
    FIREBASE_STORAGE_BUCKET: 'ai-sports-edge.appspot.com',
    FIREBASE_MESSAGING_SENDER_ID: '123456789012',
    FIREBASE_APP_ID: '1:123456789012:web:abcdef1234567890',
    FIREBASE_MEASUREMENT_ID: 'G-52JHSJCWN',
  };
  
  return envVars[key] || defaultValue;
};

// Firebase configuration
const firebaseConfig = {
  apiKey: getEnvVar('FIREBASE_API_KEY'),
  authDomain: getEnvVar('FIREBASE_AUTH_DOMAIN', 'ai-sports-edge.firebaseapp.com'),
  projectId: getEnvVar('FIREBASE_PROJECT_ID', 'ai-sports-edge'),
  storageBucket: getEnvVar('FIREBASE_STORAGE_BUCKET', 'ai-sports-edge.appspot.com'),
  messagingSenderId: getEnvVar('FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('FIREBASE_APP_ID'),
  measurementId: getEnvVar('FIREBASE_MEASUREMENT_ID'),
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const firestore = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export const analytics = getAnalytics(app);

export default app;