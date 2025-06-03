/**
 * Firebase Auth Molecule
 * Provides Firebase authentication functionality.
 * Combines the Firebase app atom with authentication-specific features.
 */

// External imports
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateEmail,
  updatePassword,
  updateProfile,
} from 'firebase/auth';

// Internal imports
import { getFirebaseApp } from '../atoms/firebaseApp';

// Firebase Auth instance (singleton)
let auth = null;

/**
 * Initialize Firebase Auth
 *
 * @returns {Object|null} Firebase Auth instance or null if initialization failed
 */
export const initializeFirebaseAuth = () => {
  try {
    // Get Firebase app instance
    const app = getFirebaseApp();

    if (!app) {
      console.error('Firebase Auth initialization failed: Firebase app not initialized');
      return null;
    }

    // Initialize Auth
    auth = getAuth(app);

    // Add better error handling for auth operations
    onAuthStateChanged(
      auth,
      user => {
        console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
      },
      error => {
        console.error('Auth state change error:', error);
      }
    );

    console.log('Firebase Auth initialized successfully');
    return auth;
  } catch (error) {
    console.error('Error initializing Firebase Auth:', error);
    return null;
  }
};

/**
 * Get Firebase Auth instance
 * Initializes auth if it hasn't been initialized yet
 *
 * @returns {Object|null} Firebase Auth instance or null if initialization failed
 */
export const getFirebaseAuth = () => {
  if (!auth) {
    return initializeFirebaseAuth();
  }
  return auth;
};

/**
 * Get current user
 *
 * @returns {Object|null} Current user or null if not signed in
 */
export const getCurrentUser = () => {
  const authInstance = getFirebaseAuth();
  return authInstance ? authInstance.currentUser : null;
};

/**
 * Sign in with email and password
 *
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User credential
 */
export const signIn = async (email, password) => {
  try {
    const authInstance = getFirebaseAuth();

    if (!authInstance) {
      throw new Error('Firebase Auth not initialized');
    }

    const userCredential = await signInWithEmailAndPassword(authInstance, email, password);
    return userCredential;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};

/**
 * Create a new user with email and password
 *
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User credential
 */
export const createUser = async (email, password) => {
  try {
    const authInstance = getFirebaseAuth();

    if (!authInstance) {
      throw new Error('Firebase Auth not initialized');
    }

    const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
    return userCredential;
  } catch (error) {
    console.error('Create user error:', error);
    throw error;
  }
};

/**
 * Sign out the current user
 *
 * @returns {Promise<void>}
 */
export const logOut = async () => {
  try {
    const authInstance = getFirebaseAuth();

    if (!authInstance) {
      throw new Error('Firebase Auth not initialized');
    }

    await signOut(authInstance);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

/**
 * Send password reset email
 *
 * @param {string} email - User email
 * @returns {Promise<void>}
 */
export const resetPassword = async email => {
  try {
    const authInstance = getFirebaseAuth();

    if (!authInstance) {
      throw new Error('Firebase Auth not initialized');
    }

    await sendPasswordResetEmail(authInstance, email);
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
};

/**
 * Update user email
 *
 * @param {Object} user - User object
 * @param {string} newEmail - New email
 * @returns {Promise<void>}
 */
export const updateUserEmail = async (user, newEmail) => {
  try {
    const authInstance = getFirebaseAuth();

    if (!authInstance) {
      throw new Error('Firebase Auth not initialized');
    }

    if (!user) {
      throw new Error('User not provided');
    }

    await updateEmail(user, newEmail);
  } catch (error) {
    console.error('Update email error:', error);
    throw error;
  }
};

/**
 * Update user password
 *
 * @param {Object} user - User object
 * @param {string} newPassword - New password
 * @returns {Promise<void>}
 */
export const updateUserPassword = async (user, newPassword) => {
  try {
    const authInstance = getFirebaseAuth();

    if (!authInstance) {
      throw new Error('Firebase Auth not initialized');
    }

    if (!user) {
      throw new Error('User not provided');
    }

    await updatePassword(user, newPassword);
  } catch (error) {
    console.error('Update password error:', error);
    throw error;
  }
};

/**
 * Update user profile
 *
 * @param {Object} user - User object
 * @param {Object} profileData - Profile data to update
 * @param {string} profileData.displayName - User display name
 * @param {string} profileData.photoURL - User photo URL
 * @returns {Promise<void>}
 */
export const updateUserProfile = async (user, profileData) => {
  try {
    const authInstance = getFirebaseAuth();

    if (!authInstance) {
      throw new Error('Firebase Auth not initialized');
    }

    if (!user) {
      throw new Error('User not provided');
    }

    await updateProfile(user, profileData);
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
};

// Initialize Firebase Auth on module load
initializeFirebaseAuth();

// Export Firebase Auth instance
export { auth };
