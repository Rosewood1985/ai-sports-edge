import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Storage key for tracking if download prompt has been shown
const APP_DOWNLOAD_PROMPT_SHOWN_KEY = 'app_download_prompt_shown';

// App store URLs
const APP_STORE_URL = 'https://apps.apple.com/us/app/ai-sports-edge/id1234567890';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.aisportsedge.app';
const WEB_APP_URL = 'https://aisportsedge.com';

/**
 * Service for handling mobile app download prompts
 */
class AppDownloadService {
  /**
   * Check if the app download prompt should be shown
   * @param userId User ID to check for
   * @returns Promise that resolves to true if prompt should be shown
   */
  async shouldShowDownloadPrompt(userId: string): Promise<boolean> {
    try {
      // Don't show prompt on native mobile platforms
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        return false;
      }
      
      // Check if prompt has been shown for this user
      const key = `${APP_DOWNLOAD_PROMPT_SHOWN_KEY}_${userId}`;
      const promptShown = await AsyncStorage.getItem(key);
      
      return !promptShown;
    } catch (error) {
      console.error('Error checking if download prompt should be shown:', error);
      return false;
    }
  }
  
  /**
   * Mark the app download prompt as shown for a user
   * @param userId User ID to mark as shown
   */
  async markDownloadPromptAsShown(userId: string): Promise<void> {
    try {
      const key = `${APP_DOWNLOAD_PROMPT_SHOWN_KEY}_${userId}`;
      await AsyncStorage.setItem(key, 'true');
    } catch (error) {
      console.error('Error marking download prompt as shown:', error);
    }
  }
  
  /**
   * Get app store URLs
   * @returns Object containing app store URLs
   */
  getAppStoreUrls(): { appStoreUrl: string; playStoreUrl: string; webAppUrl: string } {
    return {
      appStoreUrl: APP_STORE_URL,
      playStoreUrl: PLAY_STORE_URL,
      webAppUrl: WEB_APP_URL
    };
  }
}

// Export as singleton
export const appDownloadService = new AppDownloadService();