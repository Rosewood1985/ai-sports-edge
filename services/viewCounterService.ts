import { firebaseService } from '../src/atomic/organisms/firebaseService';
import '@react-native-async-storage/async-storage';
import { firestore, auth } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { analyticsService } from './analyticsService';
import environmentUtils from '../utils/environmentUtils';

// Constants
const LOCAL_VIEW_COUNTER_KEY = 'player_stats_view_counter';
const DEFAULT_MAX_FREE_VIEWS = 4;
const SYNC_THRESHOLD = 3; // Sync with server every 3 views

// View counter collection and fields
const VIEW_COUNTERS_COLLECTION = 'viewCounters';
const FIELD_COUNT = 'count';
const FIELD_LAST_RESET = 'lastReset';
const FIELD_NEXT_RESET = 'nextReset';
const FIELD_MAX_VIEWS = 'maxViews';
const FIELD_BONUS_VIEWS = 'bonusViews';
const FIELD_LAST_UPDATED = 'lastUpdated';
const FIELD_DEVICE_ID = 'deviceId';

/**
 * View count data interface
 */
export interface ViewCountData {
  count: number;
  lastReset: Date | null;
  nextReset: Date | null;
  maxViews: number;
  bonusViews: number;
  remainingViews: number;
  percentageUsed: number;
}

/**
 * Get a unique device identifier
 * @returns A unique device identifier
 */
const getDeviceId = async (): Promise<string> => {
  try {
    let deviceId = await AsyncStorage.getItem('device_id');
    
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      await AsyncStorage.setItem('device_id', deviceId);
    }
    
    return deviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    return `device_${Date.now()}`;
  }
};

/**
 * Calculate the next reset date (first day of next month)
 * @returns The next reset date
 */
const calculateNextResetDate = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
};

/**
 * Initialize a user's view counter in Firestore
 * @param userId User ID
 * @returns The initialized view counter data
 */
const initializeUserViewCounter = async (userId: string): Promise<ViewCountData> => {
  const db = firestore;
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  
  const now = new Date();
  const nextReset = calculateNextResetDate();
  const deviceId = await getDeviceId();
  
  const initialData = {
    [FIELD_COUNT]: 0,
    [FIELD_LAST_RESET]: serverTimestamp(),
    [FIELD_NEXT_RESET]: nextReset,
    [FIELD_MAX_VIEWS]: DEFAULT_MAX_FREE_VIEWS,
    [FIELD_BONUS_VIEWS]: 0,
    [FIELD_LAST_UPDATED]: serverTimestamp(),
    [FIELD_DEVICE_ID]: deviceId,
    userId
  };
  
  await setDoc(firebaseService.firestore.firebaseService.firestore.doc(db, VIEW_COUNTERS_COLLECTION, userId), initialData);
  
  return {
    count: 0,
    lastReset: now,
    nextReset,
    maxViews: DEFAULT_MAX_FREE_VIEWS,
    bonusViews: 0,
    remainingViews: DEFAULT_MAX_FREE_VIEWS,
    percentageUsed: 0
  };
};

/**
 * Get the user's view count data
 * @param userId User ID (optional)
 * @returns The user's view count data
 */
export const getUserViewCount = async (userId?: string): Promise<ViewCountData> => {
  try {
    // If no userId provided, try to get the current user
    const user = userId || auth.currentUser?.uid;
    
    // If we have a user ID, try to get from Firestore first
    if (user) {
      const db = firestore;
      if (db) {
        const docRef = firebaseService.firestore.firebaseService.firestore.doc(db, VIEW_COUNTERS_COLLECTION, user);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          const count = data[FIELD_COUNT] || 0;
          const maxViews = data[FIELD_MAX_VIEWS] || DEFAULT_MAX_FREE_VIEWS;
          const bonusViews = data[FIELD_BONUS_VIEWS] || 0;
          const totalAllowedViews = maxViews + bonusViews;
          const remainingViews = Math.max(0, totalAllowedViews - count);
          const percentageUsed = Math.min(100, (count / totalAllowedViews) * 100);
          
          // Check if we need to reset based on the next reset date
          const nextReset = data[FIELD_NEXT_RESET]?.toDate() || calculateNextResetDate();
          const now = new Date();
          
          if (nextReset < now) {
            // Time to reset the counter
            await resetUserViewCounter(user);
            return getUserViewCount(user);
          }
          
          return {
            count,
            lastReset: data[FIELD_LAST_RESET]?.toDate() || null,
            nextReset: data[FIELD_NEXT_RESET]?.toDate() || null,
            maxViews,
            bonusViews,
            remainingViews,
            percentageUsed
          };
        } else {
          // Initialize the counter if it doesn't exist
          return initializeUserViewCounter(user);
        }
      }
    }
    
    // Fall back to local storage if no user ID or Firestore
    const count = await getLocalViewCount();
    return {
      count,
      lastReset: null,
      nextReset: null,
      maxViews: DEFAULT_MAX_FREE_VIEWS,
      bonusViews: 0,
      remainingViews: Math.max(0, DEFAULT_MAX_FREE_VIEWS - count),
      percentageUsed: Math.min(100, (count / DEFAULT_MAX_FREE_VIEWS) * 100)
    };
  } catch (error) {
    console.error('Error getting user view count:', error);
    
    // Return default values in case of error
    return {
      count: 0,
      lastReset: null,
      nextReset: null,
      maxViews: DEFAULT_MAX_FREE_VIEWS,
      bonusViews: 0,
      remainingViews: DEFAULT_MAX_FREE_VIEWS,
      percentageUsed: 0
    };
  }
};

/**
 * Get the local view count from AsyncStorage
 * @returns The local view count
 */
export const getLocalViewCount = async (): Promise<number> => {
  try {
    const count = await AsyncStorage.getItem(LOCAL_VIEW_COUNTER_KEY);
    return count ? parseInt(count, 10) : 0;
  } catch (error) {
    console.error('Error getting local view count:', error);
    return 0;
  }
};

/**
 * Increment the user's view counter
 * @param userId User ID (optional)
 * @param featureType Type of feature being viewed
 * @returns The updated view count data
 */
export const incrementUserViewCount = async (
  userId?: string,
  featureType: string = 'player_stats'
): Promise<ViewCountData> => {
  try {
    // Always increment local storage count
    const currentLocalCount = await getLocalViewCount();
    const newLocalCount = currentLocalCount + 1;
    await AsyncStorage.setItem(LOCAL_VIEW_COUNTER_KEY, newLocalCount.toString());
    
    // Track the view in analytics
    await analyticsService.trackEvent(`viewed_${featureType}`, {
      count: newLocalCount
    });
    
    // If no userId provided, try to get the current user
    const user = userId || auth.currentUser?.uid;
    
    // If we have a user ID and Firestore is available, update the server count
    if (user) {
      const db = firestore;
      if (db) {
        const docRef = firebaseService.firestore.firebaseService.firestore.doc(db, VIEW_COUNTERS_COLLECTION, user);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          // Update existing counter
          await updateDoc(docRef, {
            [FIELD_COUNT]: increment(1),
            [FIELD_LAST_UPDATED]: serverTimestamp()
          });
        } else {
          // Initialize with count = 1
          const now = new Date();
          const nextReset = calculateNextResetDate();
          const deviceId = await getDeviceId();
          
          await setDoc(docRef, {
            [FIELD_COUNT]: 1,
            [FIELD_LAST_RESET]: serverTimestamp(),
            [FIELD_NEXT_RESET]: nextReset,
            [FIELD_MAX_VIEWS]: DEFAULT_MAX_FREE_VIEWS,
            [FIELD_BONUS_VIEWS]: 0,
            [FIELD_LAST_UPDATED]: serverTimestamp(),
            [FIELD_DEVICE_ID]: deviceId,
            userId: user
          });
        }
        
        // Get the updated count data
        return getUserViewCount(user);
      }
    }
    
    // If we don't have a user ID or Firestore, return local data
    return {
      count: newLocalCount,
      lastReset: null,
      nextReset: null,
      maxViews: DEFAULT_MAX_FREE_VIEWS,
      bonusViews: 0,
      remainingViews: Math.max(0, DEFAULT_MAX_FREE_VIEWS - newLocalCount),
      percentageUsed: Math.min(100, (newLocalCount / DEFAULT_MAX_FREE_VIEWS) * 100)
    };
  } catch (error) {
    console.error('Error incrementing view counter:', error);
    
    // Return default values in case of error
    return {
      count: 0,
      lastReset: null,
      nextReset: null,
      maxViews: DEFAULT_MAX_FREE_VIEWS,
      bonusViews: 0,
      remainingViews: DEFAULT_MAX_FREE_VIEWS,
      percentageUsed: 0
    };
  }
};

/**
 * Reset the user's view counter
 * @param userId User ID
 */
export const resetUserViewCounter = async (userId: string): Promise<void> => {
  try {
    const db = firestore;
    if (!db) {
      throw new Error('Firestore not initialized');
    }
    
    const now = new Date();
    const nextReset = calculateNextResetDate();
    
    await updateDoc(firebaseService.firestore.firebaseService.firestore.doc(db, VIEW_COUNTERS_COLLECTION, userId), {
      [FIELD_COUNT]: 0,
      [FIELD_LAST_RESET]: serverTimestamp(),
      [FIELD_NEXT_RESET]: nextReset,
      [FIELD_LAST_UPDATED]: serverTimestamp()
    });
    
    // Also reset local storage
    await AsyncStorage.setItem(LOCAL_VIEW_COUNTER_KEY, '0');
    
    // Track the reset in analytics
    await analyticsService.trackEvent('view_counter_reset', {
      userId,
      resetTime: now.toISOString()
    });
  } catch (error) {
    console.error('Error resetting user view counter:', error);
  }
};

/**
 * Add bonus views to a user's account
 * @param userId User ID
 * @param bonusViews Number of bonus views to add
 */
export const addBonusViews = async (userId: string, bonusViews: number): Promise<void> => {
  try {
    const db = firestore;
    if (!db) {
      throw new Error('Firestore not initialized');
    }
    
    await updateDoc(firebaseService.firestore.firebaseService.firestore.doc(db, VIEW_COUNTERS_COLLECTION, userId), {
      [FIELD_BONUS_VIEWS]: increment(bonusViews),
      [FIELD_LAST_UPDATED]: serverTimestamp()
    });
    
    // Track the bonus views in analytics
    await analyticsService.trackEvent('bonus_views_added', {
      userId,
      bonusViews
    });
  } catch (error) {
    console.error('Error adding bonus views:', error);
  }
};

/**
 * Check if the upgrade prompt should be shown based on view count
 * @param userId User ID (optional)
 * @returns Whether the upgrade prompt should be shown and the reason
 */
export const shouldShowUpgradePrompt = async (
  userId?: string
): Promise<{show: boolean; reason: string}> => {
  try {
    const viewData = await getUserViewCount(userId);
    
    // Show prompt if user has used all their views
    if (viewData.remainingViews <= 0) {
      return {
        show: true,
        reason: 'limit_reached'
      };
    }
    
    // Show prompt if user has used 75% or more of their views
    if (viewData.percentageUsed >= 75) {
      return {
        show: true,
        reason: 'approaching_limit'
      };
    }
    
    // Show prompt if this is the user's 3rd view (good time to introduce premium)
    if (viewData.count === 3) {
      return {
        show: true,
        reason: 'engagement_opportunity'
      };
    }
    
    return {
      show: false,
      reason: 'below_threshold'
    };
  } catch (error) {
    console.error('Error checking if upgrade prompt should be shown:', error);
    return {
      show: false,
      reason: 'error'
    };
  }
};

/**
 * Sync local view count with server
 * This is useful when the user logs in after using the app as a guest
 * @param userId User ID
 */
export const syncViewCount = async (userId: string): Promise<void> => {
  try {
    const localCount = await getLocalViewCount();
    
    // Only sync if local count is greater than 0
    if (localCount > 0) {
      const db = firestore;
      if (!db) {
        return;
      }
      
      const docRef = firebaseService.firestore.firebaseService.firestore.doc(db, VIEW_COUNTERS_COLLECTION, userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const serverCount = docSnap.data()[FIELD_COUNT] || 0;
        
        // Use the maximum of local and server counts
        const newCount = Math.max(localCount, serverCount);
        
        await updateDoc(docRef, {
          [FIELD_COUNT]: newCount,
          [FIELD_LAST_UPDATED]: serverTimestamp()
        });
      } else {
        // Initialize with the local count
        await initializeUserViewCounter(userId);
        
        // Update the count to match local
        await updateDoc(docRef, {
          [FIELD_COUNT]: localCount
        });
      }
      
      // Track the sync in analytics
      await analyticsService.trackEvent('view_count_synced', {
        userId,
        localCount,
        serverCount: docSnap.exists() ? docSnap.data()[FIELD_COUNT] || 0 : 0
      });
    }
  } catch (error) {
    console.error('Error syncing view count:', error);
  }
};

export default {
  getUserViewCount,
  getLocalViewCount,
  incrementUserViewCount,
  resetUserViewCounter,
  addBonusViews,
  shouldShowUpgradePrompt,
  syncViewCount,
  DEFAULT_MAX_FREE_VIEWS
};