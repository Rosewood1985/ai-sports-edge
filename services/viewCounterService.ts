import AsyncStorage from '@react-native-async-storage/async-storage';

const VIEW_COUNTER_KEY = 'player_stats_view_counter';
const MAX_FREE_VIEWS = 4;

/**
 * Increment the view counter for player statistics
 * @returns The new count after incrementing
 */
export const incrementViewCounter = async (): Promise<number> => {
  try {
    const currentCount = await getViewCount();
    const newCount = currentCount + 1;
    await AsyncStorage.setItem(VIEW_COUNTER_KEY, newCount.toString());
    return newCount;
  } catch (error) {
    console.error('Error incrementing view counter:', error);
    return 0;
  }
};

/**
 * Get the current view count for player statistics
 * @returns The current view count
 */
export const getViewCount = async (): Promise<number> => {
  try {
    const count = await AsyncStorage.getItem(VIEW_COUNTER_KEY);
    return count ? parseInt(count, 10) : 0;
  } catch (error) {
    console.error('Error getting view count:', error);
    return 0;
  }
};

/**
 * Check if the upgrade prompt should be shown based on view count
 * @returns Whether the upgrade prompt should be shown
 */
export const shouldShowUpgradePrompt = async (): Promise<boolean> => {
  const count = await getViewCount();
  return count >= MAX_FREE_VIEWS;
};

/**
 * Reset the view counter to zero
 */
export const resetViewCounter = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(VIEW_COUNTER_KEY, '0');
  } catch (error) {
    console.error('Error resetting view counter:', error);
  }
};

export default {
  incrementViewCounter,
  getViewCount,
  shouldShowUpgradePrompt,
  resetViewCounter,
  MAX_FREE_VIEWS
};