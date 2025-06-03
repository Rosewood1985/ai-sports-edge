/**
 * Environment utility functions
 */

import { Platform } from 'react-native';

/**
 * Check if the app is running in development mode
 * @returns {boolean} True if in development mode
 */
export const isDevelopmentMode = (): boolean => {
  // Add detailed logging to diagnose Expo Go detection issues
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('Platform.constants:', Platform.constants);

  // Check if running in Expo Go
  const isNodeEnvDev = process.env.NODE_ENV === 'development';

  // Check for Expo-specific properties safely
  let hasExpoConstants = false;
  try {
    // @ts-ignore - Checking if this property exists at runtime
    hasExpoConstants =
      Platform.constants &&
      Platform.constants.reactNativeVersion &&
      Platform.constants.reactNativeVersion.hasOwnProperty('expo');
  } catch (e) {
    console.log('Error checking for Expo constants:', e);
  }

  console.log('isNodeEnvDev:', isNodeEnvDev);
  console.log('hasExpoConstants:', hasExpoConstants);

  const isExpoGo = isNodeEnvDev || hasExpoConstants;
  console.log('isDevelopmentMode result:', isExpoGo);

  return isExpoGo;
};

/**
 * Check if Firebase is properly initialized
 * @param firestore - Firestore instance
 * @returns {boolean} True if Firebase is properly initialized
 */
export const isFirebaseInitialized = (firestore: any): boolean => {
  return !!firestore && typeof firestore.collection === 'function';
};

export default {
  isDevelopmentMode,
  isFirebaseInitialized,
};
