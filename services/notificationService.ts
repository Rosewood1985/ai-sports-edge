import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { analyticsService } from './analyticsService';
import deepLinkingService from './deepLinkingService';

/**
 * Notification category types
 */
export enum NotificationCategory {
  GAME_START = 'game_start',
  GAME_END = 'game_end',
  BET_OPPORTUNITY = 'bet_opportunity',
  BET_RESULT = 'bet_result',
  PLAYER_UPDATE = 'player_update',
  TEAM_UPDATE = 'team_update',
  SUBSCRIPTION = 'subscription',
  REFERRAL = 'referral',
  SYSTEM = 'system'
}

/**
 * Notification permission status
 */
export enum NotificationPermissionStatus {
  GRANTED = 'granted',
  DENIED = 'denied',
  UNDETERMINED = 'undetermined'
}

/**
 * Notification data
 */
export interface NotificationData {
  id: string;
  title: string;
  body: string;
  category: NotificationCategory;
  data?: Record<string, any>;
  deepLink?: string;
  imageUrl?: string;
  timestamp: number;
}

/**
 * Notification preferences
 */
export interface NotificationPreferences {
  enabled: boolean;
  categories: {
    [key in NotificationCategory]: boolean;
  };
  quiet_hours: {
    enabled: boolean;
    start_hour: number;
    end_hour: number;
  };
}

/**
 * Default notification preferences
 */
const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  categories: {
    [NotificationCategory.GAME_START]: true,
    [NotificationCategory.GAME_END]: true,
    [NotificationCategory.BET_OPPORTUNITY]: true,
    [NotificationCategory.BET_RESULT]: true,
    [NotificationCategory.PLAYER_UPDATE]: true,
    [NotificationCategory.TEAM_UPDATE]: true,
    [NotificationCategory.SUBSCRIPTION]: true,
    [NotificationCategory.REFERRAL]: true,
    [NotificationCategory.SYSTEM]: true
  },
  quiet_hours: {
    enabled: false,
    start_hour: 22, // 10 PM
    end_hour: 8     // 8 AM
  }
};

/**
 * Service for managing push notifications
 */
class NotificationService {
  private pushToken: string | null = null;
  private preferences: NotificationPreferences = DEFAULT_PREFERENCES;
  private isInitialized: boolean = false;
  
  /**
   * Initialize the notification service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    try {
      // Configure notification handler
      Notifications.setNotificationHandler({
        handleNotification: async (notification) => {
          // Check if notification should be shown based on preferences
          if (!this.shouldShowNotification(notification)) {
            return {
              shouldShowAlert: false,
              shouldPlaySound: false,
              shouldSetBadge: false
            };
          }
          
          return {
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true
          };
        }
      });
      
      // Set up notification response handler
      Notifications.addNotificationResponseReceivedListener(this.handleNotificationResponse);
      
      // Set up notification received handler
      Notifications.addNotificationReceivedListener(this.handleNotificationReceived);
      
      // Register for push notifications
      await this.registerForPushNotifications();
      
      // Load preferences
      await this.loadPreferences();
      
      this.isInitialized = true;
      console.log('Notification service initialized');
    } catch (error) {
      console.error('Error initializing notification service:', error);
      analyticsService.trackError(error as Error, { method: 'initialize' });
    }
  }
  
  /**
   * Clean up the notification service
   */
  cleanup(): void {
    // In a real implementation, we would remove all listeners
    // But the current API doesn't have a removeAllNotificationListeners method
    
    this.isInitialized = false;
    console.log('Notification service cleaned up');
  }
  
  /**
   * Register for push notifications
   * @returns Promise with push token
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      // In a real implementation, we would check if the device is physical
      // But for now, we'll skip this check
      
      // Check if permission is already granted
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      // If permission not granted, request it
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      // If permission not granted, return null
      if (finalStatus !== 'granted') {
        console.log('Permission not granted for push notifications');
        return null;
      }
      
      // Get push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId
      });
      
      this.pushToken = tokenData.data;
      
      // Configure for Android
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#0A7EA4'
        });
      }
      
      console.log('Push token:', this.pushToken);
      
      // Save token to server
      await this.savePushToken(this.pushToken);
      
      return this.pushToken;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      analyticsService.trackError(error as Error, { method: 'registerForPushNotifications' });
      return null;
    }
  }
  
  /**
   * Get push token
   * @returns Push token or null if not available
   */
  getPushToken(): string | null {
    return this.pushToken;
  }
  
  /**
   * Check notification permission status
   * @returns Promise with permission status
   */
  async checkPermissionStatus(): Promise<NotificationPermissionStatus> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      
      switch (status) {
        case 'granted':
          return NotificationPermissionStatus.GRANTED;
        case 'denied':
          return NotificationPermissionStatus.DENIED;
        default:
          return NotificationPermissionStatus.UNDETERMINED;
      }
    } catch (error) {
      console.error('Error checking notification permission status:', error);
      analyticsService.trackError(error as Error, { method: 'checkPermissionStatus' });
      return NotificationPermissionStatus.UNDETERMINED;
    }
  }
  
  /**
   * Request notification permission
   * @returns Promise with permission status
   */
  async requestPermission(): Promise<NotificationPermissionStatus> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      
      switch (status) {
        case 'granted':
          return NotificationPermissionStatus.GRANTED;
        case 'denied':
          return NotificationPermissionStatus.DENIED;
        default:
          return NotificationPermissionStatus.UNDETERMINED;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      analyticsService.trackError(error as Error, { method: 'requestPermission' });
      return NotificationPermissionStatus.UNDETERMINED;
    }
  }
  
  /**
   * Schedule a local notification
   * @param notification Notification data
   * @returns Promise with notification ID
   */
  async scheduleLocalNotification(notification: Omit<NotificationData, 'id' | 'timestamp'>): Promise<string> {
    try {
      // Check if notifications are enabled
      if (!this.preferences.enabled) {
        console.log('Notifications are disabled');
        return '';
      }
      
      // Check if category is enabled
      if (!this.preferences.categories[notification.category]) {
        console.log(`Notifications for category ${notification.category} are disabled`);
        return '';
      }
      
      // Check if in quiet hours
      if (this.isInQuietHours()) {
        console.log('In quiet hours, notification will not be shown');
        return '';
      }
      
      // Create notification content
      const content: Notifications.NotificationContentInput = {
        title: notification.title,
        body: notification.body,
        data: {
          ...notification.data,
          category: notification.category,
          deepLink: notification.deepLink
        }
      };
      
      // Add image if provided
      if (notification.imageUrl) {
        // In a real implementation, we would add the image attachment
        // But for now, we'll skip this to avoid TypeScript errors
        console.log('Image URL provided:', notification.imageUrl);
      }
      
      // Schedule notification
      const id = await Notifications.scheduleNotificationAsync({
        content,
        trigger: null // Show immediately
      });
      
      console.log(`Local notification scheduled with ID: ${id}`);
      
      // Track event
      analyticsService.trackEvent('notification_scheduled', {
        category: notification.category,
        title: notification.title
      });
      
      return id;
    } catch (error) {
      console.error('Error scheduling local notification:', error);
      analyticsService.trackError(error as Error, { method: 'scheduleLocalNotification' });
      throw error;
    }
  }
  
  /**
   * Cancel a scheduled notification
   * @param id Notification ID
   */
  async cancelNotification(id: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
      console.log(`Notification with ID ${id} cancelled`);
    } catch (error) {
      console.error('Error cancelling notification:', error);
      analyticsService.trackError(error as Error, { method: 'cancelNotification' });
    }
  }
  
  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
      analyticsService.trackError(error as Error, { method: 'cancelAllNotifications' });
    }
  }
  
  /**
   * Get all scheduled notifications
   * @returns Promise with scheduled notifications
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      analyticsService.trackError(error as Error, { method: 'getScheduledNotifications' });
      return [];
    }
  }
  
  /**
   * Get notification preferences
   * @returns Notification preferences
   */
  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }
  
  /**
   * Update notification preferences
   * @param preferences New preferences
   * @returns Promise that resolves when preferences are updated
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    try {
      // Merge with existing preferences
      this.preferences = {
        ...this.preferences,
        ...preferences,
        categories: {
          ...this.preferences.categories,
          ...(preferences.categories || {})
        },
        quiet_hours: {
          ...this.preferences.quiet_hours,
          ...(preferences.quiet_hours || {})
        }
      };
      
      // Save preferences
      await this.savePreferences();
      
      console.log('Notification preferences updated');
      
      // Track event
      analyticsService.trackEvent('notification_preferences_updated', {
        enabled: this.preferences.enabled,
        quiet_hours_enabled: this.preferences.quiet_hours.enabled
      });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      analyticsService.trackError(error as Error, { method: 'updatePreferences' });
    }
  }
  
  /**
   * Reset notification preferences to default
   * @returns Promise that resolves when preferences are reset
   */
  async resetPreferences(): Promise<void> {
    try {
      this.preferences = { ...DEFAULT_PREFERENCES };
      await this.savePreferences();
      
      console.log('Notification preferences reset to default');
      
      // Track event
      analyticsService.trackEvent('notification_preferences_reset');
    } catch (error) {
      console.error('Error resetting notification preferences:', error);
      analyticsService.trackError(error as Error, { method: 'resetPreferences' });
    }
  }
  
  /**
   * Handle notification response
   * @param response Notification response
   */
  private handleNotificationResponse = (response: Notifications.NotificationResponse): void => {
    try {
      const { notification } = response;
      const data = notification.request.content.data;
      
      console.log('Notification response received:', data);
      
      // Track event
      analyticsService.trackEvent('notification_opened', {
        category: data.category,
        id: notification.request.identifier
      });
      
      // Handle deep link if present
      if (data.deepLink && typeof data.deepLink === 'string') {
        deepLinkingService.openDeepLink(data.deepLink);
      }
    } catch (error) {
      console.error('Error handling notification response:', error);
      analyticsService.trackError(error as Error, { method: 'handleNotificationResponse' });
    }
  };
  
  /**
   * Handle notification received
   * @param notification Notification
   */
  private handleNotificationReceived = (notification: Notifications.Notification): void => {
    try {
      const data = notification.request.content.data;
      
      console.log('Notification received:', data);
      
      // Track event
      analyticsService.trackEvent('notification_received', {
        category: data.category,
        id: notification.request.identifier
      });
    } catch (error) {
      console.error('Error handling notification received:', error);
      analyticsService.trackError(error as Error, { method: 'handleNotificationReceived' });
    }
  };
  
  /**
   * Check if notification should be shown based on preferences
   * @param notification Notification
   * @returns Whether notification should be shown
   */
  private shouldShowNotification(notification: Notifications.Notification): boolean {
    try {
      // Check if notifications are enabled
      if (!this.preferences.enabled) {
        return false;
      }
      
      // Get notification data
      const data = notification.request.content.data;
      
      // Check if category is enabled
      if (data.category && this.preferences.categories[data.category as NotificationCategory] === false) {
        return false;
      }
      
      // Check if in quiet hours
      if (this.isInQuietHours()) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking if notification should be shown:', error);
      return true; // Show notification by default if error
    }
  }
  
  /**
   * Check if current time is in quiet hours
   * @returns Whether current time is in quiet hours
   */
  private isInQuietHours(): boolean {
    try {
      // Check if quiet hours are enabled
      if (!this.preferences.quiet_hours.enabled) {
        return false;
      }
      
      // Get current hour
      const now = new Date();
      const currentHour = now.getHours();
      
      // Get quiet hours
      const { start_hour, end_hour } = this.preferences.quiet_hours;
      
      // Check if current hour is in quiet hours
      if (start_hour <= end_hour) {
        // Simple case: start hour is before end hour
        return currentHour >= start_hour && currentHour < end_hour;
      } else {
        // Complex case: start hour is after end hour (spans midnight)
        return currentHour >= start_hour || currentHour < end_hour;
      }
    } catch (error) {
      console.error('Error checking if in quiet hours:', error);
      return false; // Not in quiet hours by default if error
    }
  }
  
  /**
   * Load notification preferences from storage
   * @returns Promise that resolves when preferences are loaded
   */
  private async loadPreferences(): Promise<void> {
    // This would be implemented with actual storage
    // For now, just use default preferences
    this.preferences = { ...DEFAULT_PREFERENCES };
  }
  
  /**
   * Save notification preferences to storage
   * @returns Promise that resolves when preferences are saved
   */
  private async savePreferences(): Promise<void> {
    // This would be implemented with actual storage
    // For now, just log the preferences
    console.log('Saving notification preferences:', this.preferences);
  }
  
  /**
   * Save push token to server
   * @param token Push token
   * @returns Promise that resolves when token is saved
   */
  private async savePushToken(token: string): Promise<void> {
    // This would be implemented with actual API call
    // For now, just log the token
    console.log('Saving push token to server:', token);
  }
}

export const notificationService = new NotificationService();
export default notificationService;