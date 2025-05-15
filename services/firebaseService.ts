/**
 * Firebase Service
 * Handles interactions with Firebase for cross-platform data synchronization
 * Fully migrated to use atomic architecture
 */

import { Platform } from 'react-native';
import { firebaseService } from '../src/atomic/organisms/firebaseService';
import { isFirebaseInitialized } from '../utils/environmentUtils';
import { trackEvent } from '../src/atomic/molecules/analyticsService';

// Define types
export interface UserData {
  purchasedOdds?: PurchasedOdds[];
  userPreferences?: UserPreferences;
  lastSyncTimestamp?: number;
}

export interface PurchasedOdds {
  gameId: string;
  timestamp: number;
  platform: string;
}

export interface UserPreferences {
  favoriteTeams: string[];
  primaryTeam: string;
  buttonSettings: any;
  affiliateEnabled: boolean;
  affiliateCode: string;
  lastUpdated?: number;
  lastPlatform?: string;
}

/**
 * Initialize Firebase service
 * Sets up auth state listener and initializes the service
 * @returns Promise that resolves when initialization is complete
 */
export const initialize = async (): Promise<void> => {
  try {
    // Set up auth state listener if auth is available
    if (firebaseService.auth.instance) {
      firebaseService.auth.onAuthStateChange((user) => {
        if (user) {
          // Store user ID in local storage or context if needed
          trackEvent('user_authenticated', { userId: user.uid });
        } else {
          // Clear user ID from local storage or context if needed
          trackEvent('user_signed_out', {});
        }
      });
    } else {
      console.warn('Firebase auth is not available, using mock authentication');
    }

    console.log('Firebase service initialized');
  } catch (error) {
    console.error('Error initializing Firebase service:', error);
    throw error;
  }
};

/**
 * Get user data from Firestore
 * @param userId User ID
 * @param lastSyncTimestamp Last sync timestamp
 * @returns User data
 */
export const getUserData = async (userId: string, lastSyncTimestamp: number = 0): Promise<UserData | null> => {
  try {
    // Check if Firestore is available
    if (!isFirebaseInitialized(firebaseService.firestore.instance)) {
      console.warn('Firestore is not available, using mock data');
      return getMockUserData(userId);
    }

    // Get user document
    const userData = await firebaseService.firestore.getDocument('users', userId) as UserData;
    
    if (!userData) {
      return null;
    }

    // Get purchased odds that were updated after last sync
    if (lastSyncTimestamp > 0) {
      // Create query constraints as an array
      const queryConstraints = [
        firebaseService.firestore.where('timestamp', '>', lastSyncTimestamp)
      ];

      const purchasedOddsSnapshot = await firebaseService.firestore.getCollection(
        `users/${userId}/purchasedOdds`,
        queryConstraints
      );
      
      const purchasedOdds: PurchasedOdds[] = [];

      purchasedOddsSnapshot.forEach((doc: any) => {
        const data = doc.data();
        purchasedOdds.push({
          gameId: doc.id,
          timestamp: data.timestamp,
          platform: data.platform || 'unknown',
        });
      });

      userData.purchasedOdds = purchasedOdds;
    }

    return userData;
  } catch (error) {
    console.error('Error getting user data:', error);
    return getMockUserData(userId);
  }
};

/**
 * Get mock user data for development or when Firebase is unavailable
 * @param userId User ID
 * @returns Mock user data
 */
const getMockUserData = (userId: string): UserData => {
  return {
    purchasedOdds: [],
    userPreferences: {
      favoriteTeams: [],
      primaryTeam: '',
      buttonSettings: {
        size: 'medium',
        animation: 'pulse',
        position: 'inline',
        style: 'default'
      },
      affiliateEnabled: true,
      affiliateCode: 'MOCK_CODE',
      lastUpdated: Date.now(),
      lastPlatform: Platform.OS
    },
    lastSyncTimestamp: Date.now()
  };
};

/**
 * Update user data in Firestore
 * @param userId User ID
 * @param data User data to update
 */
export const updateUserData = async (userId: string, data: UserData): Promise<void> => {
  try {
    // Check if Firestore is available
    if (!isFirebaseInitialized(firebaseService.firestore.instance)) {
      console.warn('Firestore is not available, skipping update');
      return;
    }

    // Check if user document exists
    const userExists = await firebaseService.firestore.getDocument('users', userId);

    if (userExists) {
      // Update existing document
      await firebaseService.firestore.updateDocument('users', userId, {
        ...data,
        lastSyncTimestamp: Date.now(),
        lastUpdated: firebaseService.firestore.serverTimestamp(),
      });
    } else {
      // Create new document
      await firebaseService.firestore.setDocument('users', userId, {
        ...data,
        lastSyncTimestamp: Date.now(),
        lastUpdated: firebaseService.firestore.serverTimestamp(),
        createdAt: firebaseService.firestore.serverTimestamp(),
        platform: Platform.OS,
      });
    }

    // Update purchased odds subcollection
    if (data.purchasedOdds && data.purchasedOdds.length > 0) {
      for (const purchase of data.purchasedOdds) {
        // Use the correct signature for setDocument (without merge option as 4th param)
        await firebaseService.firestore.setDocument(
          `users/${userId}/purchasedOdds`,
          purchase.gameId,
          {
            timestamp: purchase.timestamp,
            platform: purchase.platform,
            updatedAt: firebaseService.firestore.serverTimestamp(),
            merge: true // Include merge as part of the data object
          }
        );
      }
    }

    console.log('User data updated successfully');
    
    // Track analytics event
    trackEvent('user_data_updated', { userId });
  } catch (error) {
    console.error('Error updating user data:', error);
    // Don't throw error in production, just log it
    if (__DEV__) {
      throw error;
    }
  }
};

/**
 * Get current user ID
 * @returns Current user ID or null if not authenticated
 */
export const getCurrentUserId = (): string | null => {
  // Handle undefined case explicitly to satisfy TypeScript
  const uid = firebaseService.auth.instance?.currentUser?.uid;
  return uid || null;
};

/**
 * Subscribe to user data changes
 * @param userId User ID
 * @param callback Callback function that receives updated user data
 * @returns Unsubscribe function
 */
export const subscribeToUserData = (userId: string, callback: (userData: UserData | null) => void): (() => void) => {
  if (!isFirebaseInitialized(firebaseService.firestore.instance)) {
    console.warn('Firestore is not available, cannot subscribe to user data');
    return () => {};
  }

  // Use the correct signature for subscribeToDocument with only 3 arguments
  return firebaseService.firestore.subscribeToDocument(
    'users',
    userId,
    (doc: any) => {
      try {
        if (doc && doc.exists) {
          callback(doc.data() as UserData);
        } else {
          callback(null);
        }
      } catch (error) {
        console.error('Error subscribing to user data:', error);
        callback(null);
      }
    }
  );
};

/**
 * Check if user exists in Firestore
 * @param userId User ID
 * @returns Whether the user exists
 */
export const userExists = async (userId: string): Promise<boolean> => {
  try {
    if (!isFirebaseInitialized(firebaseService.firestore.instance)) {
      console.warn('Firestore is not available, assuming user exists');
      return true;
    }

    const userDoc = await firebaseService.firestore.getDocument('users', userId);
    return !!userDoc;
  } catch (error) {
    console.error('Error checking if user exists:', error);
    return false;
  }
};

// Export as a service object for consistency with atomic architecture
export const firebaseDataService = {
  initialize,
  getUserData,
  updateUserData,
  getCurrentUserId,
  subscribeToUserData,
  userExists
};

export default firebaseDataService;