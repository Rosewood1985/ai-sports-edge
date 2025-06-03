import {
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  runTransaction,
  setDoc,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { analyticsService } from './analyticsService';
import { hasPremiumAccess } from './firebaseSubscriptionService';
import { firestore, functions } from '../config/firebase';
import environmentUtils from '../utils/environmentUtils';

const isDevMode = environmentUtils.isDevelopmentMode();

// Microtransaction IDs
export const ADVANCED_METRICS_PRODUCT_ID = 'advanced-player-metrics';
export const PLAYER_COMPARISON_PRODUCT_ID = 'player-comparison-tool';
export const HISTORICAL_TRENDS_PRODUCT_ID = 'historical-player-trends';

// Microtransaction prices (in cents)
export const ADVANCED_METRICS_PRICE = 99; // $0.99
export const PLAYER_COMPARISON_PRICE = 99; // $0.99
export const HISTORICAL_TRENDS_PRICE = 199; // $1.99

// Bundle product ID
export const PREMIUM_BUNDLE_PRODUCT_ID = 'premium-player-stats-bundle';
export const PREMIUM_BUNDLE_PRICE = 299; // $2.99

// Free tier limits
export const FREE_TIER_VIEW_LIMIT = 5; // Number of free views before requiring upgrade
export const FREE_TIER_WARNING_THRESHOLD = 2; // Show warning when this many views are left

/**
 * Check if a user has access to advanced player metrics for a specific game
 * @param userId User ID
 * @param gameId Game ID
 * @returns Whether the user has access
 */
export const hasAdvancedPlayerMetricsAccess = async (
  userId: string,
  gameId: string
): Promise<boolean> => {
  try {
    // In development mode, always return true
    if (isDevMode) {
      console.log('Development mode: Simulating advanced metrics access');
      return true;
    }

    // First check if user has premium access
    const hasPremium = await hasPremiumAccess(userId);
    if (hasPremium) {
      return true;
    }

    // Check for specific game purchase
    const db = firestore;
    if (!db) return false;

    const purchasesSnapshot = await getDocs(
      query(
        collection(db, 'users', userId, 'purchases'),
        where('productId', '==', ADVANCED_METRICS_PRODUCT_ID),
        where('gameId', '==', gameId),
        where('status', '==', 'succeeded')
      )
    );

    return !purchasesSnapshot.empty;
  } catch (error) {
    console.error('Error checking advanced metrics access:', error);
    return false;
  }
};

/**
 * Check if a user has access to player comparison tool for a specific game
 * @param userId User ID
 * @param gameId Game ID
 * @returns Whether the user has access
 */
export const hasPlayerComparisonAccess = async (
  userId: string,
  gameId: string
): Promise<boolean> => {
  try {
    // In development mode, always return true
    if (isDevMode) {
      console.log('Development mode: Simulating player comparison access');
      return true;
    }

    // First check if user has premium access
    const hasPremium = await hasPremiumAccess(userId);
    if (hasPremium) {
      return true;
    }

    // Check for specific game purchase
    const db = firestore;
    if (!db) return false;

    // Check for player comparison purchase
    const comparisonSnapshot = await getDocs(
      query(
        collection(db, 'users', userId, 'purchases'),
        where('productId', '==', PLAYER_COMPARISON_PRODUCT_ID),
        where('gameId', '==', gameId),
        where('status', '==', 'succeeded')
      )
    );

    if (!comparisonSnapshot.empty) {
      return true;
    }

    // Check for premium bundle purchase
    const bundleSnapshot = await getDocs(
      query(
        collection(db, 'users', userId, 'purchases'),
        where('productId', '==', PREMIUM_BUNDLE_PRODUCT_ID),
        where('gameId', '==', gameId),
        where('status', '==', 'succeeded')
      )
    );

    return !bundleSnapshot.empty;
  } catch (error) {
    console.error('Error checking player comparison access:', error);
    return false;
  }
};

/**
 * Check if a user has access to historical trends for a specific game
 * @param userId User ID
 * @param gameId Game ID
 * @returns Whether the user has access
 */
export const hasHistoricalTrendsAccess = async (
  userId: string,
  gameId: string
): Promise<boolean> => {
  try {
    // In development mode, always return true
    if (isDevMode) {
      console.log('Development mode: Simulating historical trends access');
      return true;
    }

    // First check if user has premium access
    const hasPremium = await hasPremiumAccess(userId);
    if (hasPremium) {
      return true;
    }

    // Check for specific game purchase
    const db = firestore;
    if (!db) return false;

    // Check for historical trends purchase
    const trendsSnapshot = await getDocs(
      query(
        collection(db, 'users', userId, 'purchases'),
        where('productId', '==', HISTORICAL_TRENDS_PRODUCT_ID),
        where('gameId', '==', gameId),
        where('status', '==', 'succeeded')
      )
    );

    if (!trendsSnapshot.empty) {
      return true;
    }

    // Check for premium bundle purchase
    const bundleSnapshot = await getDocs(
      query(
        collection(db, 'users', userId, 'purchases'),
        where('productId', '==', PREMIUM_BUNDLE_PRODUCT_ID),
        where('gameId', '==', gameId),
        where('status', '==', 'succeeded')
      )
    );

    return !bundleSnapshot.empty;
  } catch (error) {
    console.error('Error checking historical trends access:', error);
    return false;
  }
};

/**
 * Purchase access to advanced player metrics for a specific game
 * @param userId User ID
 * @param gameId Game ID
 * @returns Whether the purchase was successful
 */
export const purchaseAdvancedPlayerMetrics = async (
  userId: string,
  gameId: string
): Promise<boolean> => {
  try {
    // In development mode, always return true
    if (isDevMode) {
      console.log('Development mode: Simulating advanced metrics purchase');
      return true;
    }

    // Check if user already has access
    const hasAccess = await hasAdvancedPlayerMetricsAccess(userId, gameId);
    if (hasAccess) {
      return true;
    }

    // Call the Firebase function to process the payment
    const processMicrotransactionFunc = httpsCallable(functions, 'processMicrotransaction');
    const result = await processMicrotransactionFunc({
      userId,
      productId: ADVANCED_METRICS_PRODUCT_ID,
      gameId,
      amount: ADVANCED_METRICS_PRICE,
    });

    // Track the purchase event
    await analyticsService.trackEvent('purchase_advanced_metrics', {
      gameId,
      amount: ADVANCED_METRICS_PRICE / 100, // Convert to dollars for analytics
    });

    return (result.data as any).status === 'succeeded';
  } catch (error) {
    console.error('Error purchasing advanced metrics:', error);
    return false;
  }
};

/**
 * Purchase access to player comparison tool for a specific game
 * @param userId User ID
 * @param gameId Game ID
 * @returns Whether the purchase was successful
 */
export const purchasePlayerComparison = async (
  userId: string,
  gameId: string
): Promise<boolean> => {
  try {
    // In development mode, always return true
    if (isDevMode) {
      console.log('Development mode: Simulating player comparison purchase');
      return true;
    }

    // Check if user already has access
    const hasAccess = await hasPlayerComparisonAccess(userId, gameId);
    if (hasAccess) {
      return true;
    }

    // Call the Firebase function to process the payment
    const processMicrotransactionFunc = httpsCallable(functions, 'processMicrotransaction');
    const result = await processMicrotransactionFunc({
      userId,
      productId: PLAYER_COMPARISON_PRODUCT_ID,
      gameId,
      amount: PLAYER_COMPARISON_PRICE,
    });

    // Track the purchase event
    await analyticsService.trackEvent('purchase_player_comparison', {
      gameId,
      amount: PLAYER_COMPARISON_PRICE / 100, // Convert to dollars for analytics
    });

    return (result.data as any).status === 'succeeded';
  } catch (error) {
    console.error('Error purchasing player comparison:', error);
    return false;
  }
};

/**
 * Purchase access to historical trends for a specific game
 * @param userId User ID
 * @param gameId Game ID
 * @returns Whether the purchase was successful
 */
export const purchaseHistoricalTrends = async (
  userId: string,
  gameId: string
): Promise<boolean> => {
  try {
    // In development mode, always return true
    if (isDevMode) {
      console.log('Development mode: Simulating historical trends purchase');
      return true;
    }

    // Check if user already has access
    const hasAccess = await hasHistoricalTrendsAccess(userId, gameId);
    if (hasAccess) {
      return true;
    }

    // Call the Firebase function to process the payment
    const processMicrotransactionFunc = httpsCallable(functions, 'processMicrotransaction');
    const result = await processMicrotransactionFunc({
      userId,
      productId: HISTORICAL_TRENDS_PRODUCT_ID,
      gameId,
      amount: HISTORICAL_TRENDS_PRICE,
    });

    // Track the purchase event
    await analyticsService.trackEvent('purchase_historical_trends', {
      gameId,
      amount: HISTORICAL_TRENDS_PRICE / 100, // Convert to dollars for analytics
    });

    return (result.data as any).status === 'succeeded';
  } catch (error) {
    console.error('Error purchasing historical trends:', error);
    return false;
  }
};

/**
 * Purchase premium bundle for a specific game (includes all features)
 * @param userId User ID
 * @param gameId Game ID
 * @returns Whether the purchase was successful
 */
export const purchasePremiumBundle = async (userId: string, gameId: string): Promise<boolean> => {
  try {
    // In development mode, always return true
    if (isDevMode) {
      console.log('Development mode: Simulating premium bundle purchase');
      return true;
    }

    // Check if user already has premium access
    const hasPremium = await hasPremiumAccess(userId);
    if (hasPremium) {
      return true;
    }

    // Call the Firebase function to process the payment
    const processMicrotransactionFunc = httpsCallable(functions, 'processMicrotransaction');
    const result = await processMicrotransactionFunc({
      userId,
      productId: PREMIUM_BUNDLE_PRODUCT_ID,
      gameId,
      amount: PREMIUM_BUNDLE_PRICE,
    });

    // Track the purchase event
    await analyticsService.trackEvent('purchase_premium_bundle', {
      gameId,
      amount: PREMIUM_BUNDLE_PRICE / 100, // Convert to dollars for analytics
    });

    return (result.data as any).status === 'succeeded';
  } catch (error) {
    console.error('Error purchasing premium bundle:', error);
    return false;
  }
};

/**
 * Get user's purchase history for a specific game
 * @param userId User ID
 * @param gameId Game ID
 * @returns Array of purchases
 */
export const getGamePurchaseHistory = async (userId: string, gameId: string): Promise<any[]> => {
  try {
    const db = firestore;
    if (!db) return [];

    const purchasesSnapshot = await getDocs(
      query(
        collection(db, 'users', userId, 'purchases'),
        where('gameId', '==', gameId),
        where('status', '==', 'succeeded')
      )
    );

    if (purchasesSnapshot.empty) {
      return [];
    }

    return purchasesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting game purchase history:', error);
    return [];
  }
};

/**
 * Track usage of advanced player statistics features
 * @param userId User ID
 * @param gameId Game ID
 * @param featureType Type of feature used
 */
export const trackFeatureUsage = async (
  userId: string,
  gameId: string,
  featureType: 'advanced_metrics' | 'player_comparison' | 'historical_trends'
): Promise<void> => {
  try {
    const db = firestore;
    if (!db) return;

    // Add usage record to Firestore
    await addDoc(collection(db, 'featureUsage'), {
      userId,
      gameId,
      featureType,
      timestamp: serverTimestamp(),
    });

    // Track the event
    await analyticsService.trackEvent(`used_${featureType}`, {
      gameId,
    });
  } catch (error) {
    console.error('Error tracking feature usage:', error);
  }
};

/**
 * Get the number of free views a user has used
 * @param userId User ID
 * @returns Number of free views used
 */
export const getFreeViewsUsed = async (userId: string): Promise<number> => {
  try {
    // In development mode, return a random number for testing
    if (isDevMode) {
      // Return a random number between 0 and FREE_TIER_VIEW_LIMIT
      return Math.floor(Math.random() * (FREE_TIER_VIEW_LIMIT + 1));
    }

    const db = firestore;
    if (!db) return 0;

    // Get the user's view count document
    const viewCountRef = doc(db, 'users', userId, 'stats', 'viewCount');
    const viewCountDoc = await getDoc(viewCountRef);

    if (!viewCountDoc.exists()) {
      return 0;
    }

    return viewCountDoc.data().count || 0;
  } catch (error) {
    console.error('Error getting free views used:', error);
    return 0;
  }
};

/**
 * Increment the user's free view count
 * @param userId User ID
 * @returns Updated view count
 */
export const incrementFreeViewCount = async (userId: string): Promise<number> => {
  try {
    // In development mode, return a random number for testing
    if (isDevMode) {
      return Math.floor(Math.random() * (FREE_TIER_VIEW_LIMIT + 1));
    }

    const db = firestore;
    if (!db) return 0;

    // Get the current view count
    const currentCount = await getFreeViewsUsed(userId);
    const newCount = currentCount + 1;

    // Update the view count in Firestore
    const viewCountRef = doc(db, 'users', userId, 'stats', 'viewCount');

    // Use the correct Firebase v9 transaction syntax
    await runTransaction(db, async transaction => {
      const viewCountDoc = await transaction.get(viewCountRef);

      if (!viewCountDoc.exists()) {
        transaction.set(viewCountRef, {
          count: 1,
          lastUpdated: serverTimestamp(),
        });
      } else {
        transaction.update(viewCountRef, {
          count: newCount,
          lastUpdated: serverTimestamp(),
        });
      }
    });

    // Track the event
    await analyticsService.trackEvent('free_view_used', {
      currentCount: newCount,
      remainingViews: FREE_TIER_VIEW_LIMIT - newCount,
    });

    return newCount;
  } catch (error) {
    console.error('Error incrementing free view count:', error);
    return 0;
  }
};

/**
 * Check if a user has reached their free view limit
 * @param userId User ID
 * @returns Object with hasReachedLimit and viewsRemaining
 */
export const checkFreeViewLimit = async (
  userId: string
): Promise<{
  hasReachedLimit: boolean;
  viewsRemaining: number;
  showWarning: boolean;
}> => {
  try {
    // First check if user has premium access
    const hasPremium = await hasPremiumAccess(userId);
    if (hasPremium) {
      // Premium users have unlimited views
      return {
        hasReachedLimit: false,
        viewsRemaining: Infinity,
        showWarning: false,
      };
    }

    // Get the current view count
    const viewsUsed = await getFreeViewsUsed(userId);
    const viewsRemaining = Math.max(0, FREE_TIER_VIEW_LIMIT - viewsUsed);
    const hasReachedLimit = viewsRemaining <= 0;
    const showWarning = viewsRemaining <= FREE_TIER_WARNING_THRESHOLD && !hasReachedLimit;

    return {
      hasReachedLimit,
      viewsRemaining,
      showWarning,
    };
  } catch (error) {
    console.error('Error checking free view limit:', error);
    return {
      hasReachedLimit: false,
      viewsRemaining: FREE_TIER_VIEW_LIMIT,
      showWarning: false,
    };
  }
};

/**
 * Reset a user's free view count (for testing or admin purposes)
 * @param userId User ID
 * @returns Whether the reset was successful
 */
export const resetFreeViewCount = async (userId: string): Promise<boolean> => {
  try {
    const db = firestore;
    if (!db) return false;

    // Reset the view count in Firestore
    const viewCountRef = doc(db, 'users', userId, 'stats', 'viewCount');

    // Simply set the document directly instead of using a transaction
    await setDoc(viewCountRef, {
      count: 0,
      lastUpdated: serverTimestamp(),
    });

    // Track the event
    await analyticsService.trackEvent('free_view_count_reset', {
      userId,
    });

    return true;
  } catch (error) {
    console.error('Error resetting free view count:', error);
    return false;
  }
};

export default {
  hasAdvancedPlayerMetricsAccess,
  hasPlayerComparisonAccess,
  hasHistoricalTrendsAccess,
  purchaseAdvancedPlayerMetrics,
  purchasePlayerComparison,
  purchaseHistoricalTrends,
  purchasePremiumBundle,
  getGamePurchaseHistory,
  trackFeatureUsage,
  getFreeViewsUsed,
  incrementFreeViewCount,
  checkFreeViewLimit,
  resetFreeViewCount,
  ADVANCED_METRICS_PRODUCT_ID,
  PLAYER_COMPARISON_PRODUCT_ID,
  HISTORICAL_TRENDS_PRODUCT_ID,
  PREMIUM_BUNDLE_PRODUCT_ID,
  ADVANCED_METRICS_PRICE,
  PLAYER_COMPARISON_PRICE,
  HISTORICAL_TRENDS_PRICE,
  PREMIUM_BUNDLE_PRICE,
  FREE_TIER_VIEW_LIMIT,
  FREE_TIER_WARNING_THRESHOLD,
};
