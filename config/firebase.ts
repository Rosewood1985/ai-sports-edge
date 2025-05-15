import { FirebaseError } from 'firebase/app';
import { info, error as logError, LogCategory } from '../services/loggingService';
import { safeErrorCapture } from '../services/errorUtils';
import { firebaseService } from '../src/atomic/organisms/firebaseService';

// Load environment variables - keeping this utility function for potential future use
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

// Log Firebase configuration and initialization
try {
  console.log('Firebase: Using atomic architecture Firebase service');
  info(LogCategory.APP, 'Using atomic architecture Firebase service');
  
  // Log the configuration (without sensitive values)
  const app = firebaseService.app;
  if (app) {
    console.log('Firebase: Configuration', {
      // Safe to log non-sensitive values
      projectId: app.options?.projectId || 'unknown',
      storageBucket: app.options?.storageBucket || 'unknown',
      // Don't log apiKey or other sensitive values
    });
  }
  
  // Verify services are available
  if (firebaseService.auth && firebaseService.auth.instance) {
    console.log('Firebase: Auth service available');
  } else {
    console.warn('Firebase: Auth service not properly initialized');
    info(LogCategory.APP, 'Firebase Auth service not properly initialized');
  }
  
  if (firebaseService.firestore && firebaseService.firestore.instance) {
    console.log('Firebase: Firestore service available');
  } else {
    console.warn('Firebase: Firestore service not properly initialized');
    info(LogCategory.APP, 'Firebase Firestore service not properly initialized');
  }
  
  if (firebaseService.functions && firebaseService.functions.instance) {
    console.log('Firebase: Functions service available');
  } else {
    console.warn('Firebase: Functions service not properly initialized');
    info(LogCategory.APP, 'Firebase Functions service not properly initialized');
  }
  
  info(LogCategory.APP, 'Firebase atomic services verified');
} catch (error) {
  console.error('Firebase: Failed to verify Firebase services:', error);
  logError(LogCategory.APP, 'Failed to verify Firebase services', error as Error);
  safeErrorCapture(error as Error);
  
  // Log a warning that Firebase verification failed
  console.warn('Firebase: Error verifying Firebase services');
}

// Export the consolidated service
export const { app, auth, firestore, functions } = {
  app: firebaseService.app,
  auth: firebaseService.auth.instance,
  firestore: firebaseService.firestore.instance,
  functions: firebaseService.functions.instance
};

// Export the entire service for atomic architecture usage
export { firebaseService };