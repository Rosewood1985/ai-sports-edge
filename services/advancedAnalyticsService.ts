import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserSubscription } from './subscriptionService';

/**
 * Check if user has access to advanced analytics features
 * @param userId User ID
 * @returns Whether the user has access
 */
export const hasAdvancedAnalyticsAccess = async (
  userId: string
): Promise<boolean> => {
  try {
    // Get the subscription to check if it's an advanced analytics plan
    const subscription = await getUserSubscription(userId);
    if (subscription && (
      subscription.planId === 'advanced-analytics-monthly' ||
      subscription.planId === 'advanced-analytics-yearly'
    )) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking advanced analytics access:', error);
    return false;
  }
};

/**
 * Check if user has access to historical trends for a specific game
 * @param userId User ID
 * @param gameId Game ID
 * @returns Whether the user has access
 */
export const hasHistoricalTrendsAccess = async (
  userId: string,
  gameId: string
): Promise<boolean> => {
  try {
    // First check if user has premium or advanced analytics subscription
    const subscription = await getUserSubscription(userId);
    if (subscription && (
      subscription.planId === 'premium-monthly' ||
      subscription.planId === 'premium-yearly' ||
      subscription.planId === 'advanced-analytics-monthly' ||
      subscription.planId === 'advanced-analytics-yearly'
    )) {
      return true;
    }
    
    // Check if user has purchased historical trends for this game
    const microtransactionsKey = `microtransactions_${userId}`;
    const existingMicrotransactionsData = await AsyncStorage.getItem(microtransactionsKey);
    const existingMicrotransactions = existingMicrotransactionsData ? JSON.parse(existingMicrotransactionsData) : [];
    
    // Check if user has an unused historical trends purchase for this game
    const hasUnusedHistoricalTrendsAccess = existingMicrotransactions.some(
      (purchase: any) => !purchase.used &&
      (purchase.productId === 'historical-trends-package' || 
       purchase.productId === 'player-stats-premium-bundle' ||
       purchase.productId === 'march-madness-pass') &&
      (purchase.gameId === gameId || purchase.productId === 'march-madness-pass')
    );
    
    return hasUnusedHistoricalTrendsAccess;
  } catch (error) {
    console.error('Error checking historical trends access:', error);
    return false;
  }
};

/**
 * Purchase historical trends access for a specific game
 * @param userId User ID
 * @param gameId Game ID
 * @returns Success status
 */
export const purchaseHistoricalTrends = async (
  userId: string,
  gameId: string
): Promise<boolean> => {
  try {
    // Store the purchase
    const purchaseData = {
      id: `purchase_${Date.now()}`,
      productId: 'historical-trends-package',
      gameId: gameId,
      purchaseDate: Date.now(),
      used: false
    };
    
    // Save to AsyncStorage
    const purchasesKey = `microtransactions_${userId}`;
    const existingPurchasesData = await AsyncStorage.getItem(purchasesKey);
    const existingPurchases = existingPurchasesData ? JSON.parse(existingPurchasesData) : [];
    
    existingPurchases.push(purchaseData);
    
    await AsyncStorage.setItem(purchasesKey, JSON.stringify(existingPurchases));
    
    return true;
  } catch (error) {
    console.error('Error purchasing historical trends:', error);
    return false;
  }
};

/**
 * Check if user has access to rivalry game analytics
 * @param userId User ID
 * @param gameId Game ID
 * @returns Whether the user has access
 */
export const hasRivalryGameAnalyticsAccess = async (
  userId: string,
  gameId: string
): Promise<boolean> => {
  try {
    // First check if user has advanced analytics access
    const hasAdvanced = await hasAdvancedAnalyticsAccess(userId);
    if (hasAdvanced) {
      return true;
    }
    
    // Check if user has purchased rivalry game pack for this game
    const microtransactionsKey = `microtransactions_${userId}`;
    const existingMicrotransactionsData = await AsyncStorage.getItem(microtransactionsKey);
    const existingMicrotransactions = existingMicrotransactionsData ? JSON.parse(existingMicrotransactionsData) : [];
    
    // Check if user has an unused rivalry game pack purchase for this game
    const hasUnusedRivalryGameAccess = existingMicrotransactions.some(
      (purchase: any) => !purchase.used &&
      (purchase.productId === 'rivalry-game-pack' || 
       purchase.productId === 'march-madness-pass') &&
      (purchase.gameId === gameId || purchase.productId === 'march-madness-pass')
    );
    
    return hasUnusedRivalryGameAccess;
  } catch (error) {
    console.error('Error checking rivalry game analytics access:', error);
    return false;
  }
};

/**
 * Purchase rivalry game pack for a specific game
 * @param userId User ID
 * @param gameId Game ID
 * @returns Success status
 */
export const purchaseRivalryGamePack = async (
  userId: string,
  gameId: string
): Promise<boolean> => {
  try {
    // Store the purchase
    const purchaseData = {
      id: `purchase_${Date.now()}`,
      productId: 'rivalry-game-pack',
      gameId: gameId,
      purchaseDate: Date.now(),
      used: false
    };
    
    // Save to AsyncStorage
    const purchasesKey = `microtransactions_${userId}`;
    const existingPurchasesData = await AsyncStorage.getItem(purchasesKey);
    const existingPurchases = existingPurchasesData ? JSON.parse(existingPurchasesData) : [];
    
    existingPurchases.push(purchaseData);
    
    await AsyncStorage.setItem(purchasesKey, JSON.stringify(existingPurchases));
    
    return true;
  } catch (error) {
    console.error('Error purchasing rivalry game pack:', error);
    return false;
  }
};

/**
 * Check if user has March Madness pass
 * @param userId User ID
 * @returns Whether the user has access
 */
export const hasMarchMadnessAccess = async (
  userId: string
): Promise<boolean> => {
  try {
    // First check if user has advanced analytics access
    const hasAdvanced = await hasAdvancedAnalyticsAccess(userId);
    if (hasAdvanced) {
      return true;
    }
    
    // Check if user has purchased March Madness pass
    const microtransactionsKey = `microtransactions_${userId}`;
    const existingMicrotransactionsData = await AsyncStorage.getItem(microtransactionsKey);
    const existingMicrotransactions = existingMicrotransactionsData ? JSON.parse(existingMicrotransactionsData) : [];
    
    // Check if user has an unused March Madness pass
    const hasUnusedMarchMadnessAccess = existingMicrotransactions.some(
      (purchase: any) => !purchase.used &&
      purchase.productId === 'march-madness-pass' &&
      // Check if the pass is still valid (tournament is ongoing)
      isMarchMadnessTournamentActive()
    );
    
    return hasUnusedMarchMadnessAccess;
  } catch (error) {
    console.error('Error checking March Madness access:', error);
    return false;
  }
};

/**
 * Purchase March Madness pass
 * @param userId User ID
 * @returns Success status
 */
export const purchaseMarchMadnessPass = async (
  userId: string
): Promise<boolean> => {
  try {
    // Store the purchase
    const purchaseData = {
      id: `purchase_${Date.now()}`,
      productId: 'march-madness-pass',
      purchaseDate: Date.now(),
      used: false
    };
    
    // Save to AsyncStorage
    const purchasesKey = `microtransactions_${userId}`;
    const existingPurchasesData = await AsyncStorage.getItem(purchasesKey);
    const existingPurchases = existingPurchasesData ? JSON.parse(existingPurchasesData) : [];
    
    existingPurchases.push(purchaseData);
    
    await AsyncStorage.setItem(purchasesKey, JSON.stringify(existingPurchases));
    
    return true;
  } catch (error) {
    console.error('Error purchasing March Madness pass:', error);
    return false;
  }
};

/**
 * Helper function to check if March Madness tournament is active
 * @returns Whether the tournament is active
 */
const isMarchMadnessTournamentActive = (): boolean => {
  // In a real implementation, this would check against tournament dates
  // For now, we'll use a simple date range check for March-April
  const now = new Date();
  const month = now.getMonth(); // 0-based (0 = January, 1 = February, etc.)
  
  // March (2) and April (3)
  return month === 2 || month === 3;
};

/**
 * Purchase premium bundle for a specific game
 * @param userId User ID
 * @param gameId Game ID
 * @returns Success status
 */
export const purchasePremiumBundle = async (
  userId: string,
  gameId: string
): Promise<boolean> => {
  try {
    // Store the purchase
    const purchaseData = {
      id: `purchase_${Date.now()}`,
      productId: 'player-stats-premium-bundle',
      gameId: gameId,
      purchaseDate: Date.now(),
      used: false
    };
    
    // Save to AsyncStorage
    const purchasesKey = `microtransactions_${userId}`;
    const existingPurchasesData = await AsyncStorage.getItem(purchasesKey);
    const existingPurchases = existingPurchasesData ? JSON.parse(existingPurchasesData) : [];
    
    existingPurchases.push(purchaseData);
    
    await AsyncStorage.setItem(purchasesKey, JSON.stringify(existingPurchases));
    
    return true;
  } catch (error) {
    console.error('Error purchasing premium bundle:', error);
    return false;
  }
};

export default {
  hasAdvancedAnalyticsAccess,
  hasHistoricalTrendsAccess,
  purchaseHistoricalTrends,
  hasRivalryGameAnalyticsAccess,
  purchaseRivalryGamePack,
  hasMarchMadnessAccess,
  purchaseMarchMadnessPass,
  purchasePremiumBundle
};