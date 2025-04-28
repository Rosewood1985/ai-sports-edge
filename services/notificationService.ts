// Web-compatible notification service
import * as analyticsExports from './analyticsService';
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
 * Web-compatible notification service
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
      // Check if browser supports notifications
      if (typeof window !== 'undefined' && 'Notification' in window) {
        // Request permission if needed
        if (Notification.permission !== 'granted') {
          await Notification.requestPermission();
        }
      }
      
      this.isInitialized = true;
      console.log('Notification service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }
  }
  
  /**
   * Register for push notifications
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      // Web push registration would go here
      // This is a simplified version for the web app
      this.pushToken = 'web-push-token-placeholder';
      return this.pushToken;
    } catch (error) {
      console.error('Failed to register for push notifications:', error);
      return null;
    }
  }
  
  /**
   * Check notification permission status
   */
  async checkPermissionStatus(): Promise<NotificationPermissionStatus> {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        switch (Notification.permission) {
          case 'granted':
            return NotificationPermissionStatus.GRANTED;
          case 'denied':
            return NotificationPermissionStatus.DENIED;
          default:
            return NotificationPermissionStatus.UNDETERMINED;
        }
      }
      return NotificationPermissionStatus.UNDETERMINED;
    } catch (error) {
      console.error('Failed to check notification permission status:', error);
      return NotificationPermissionStatus.UNDETERMINED;
    }
  }
  
  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermissionStatus> {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const permission = await Notification.requestPermission();
        
        switch (permission) {
          case 'granted':
            return NotificationPermissionStatus.GRANTED;
          case 'denied':
            return NotificationPermissionStatus.DENIED;
          default:
            return NotificationPermissionStatus.UNDETERMINED;
        }
      }
      return NotificationPermissionStatus.UNDETERMINED;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return NotificationPermissionStatus.UNDETERMINED;
    }
  }
  
  /**
   * Schedule a local notification
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: Record<string, any>,
    options?: {
      category?: NotificationCategory;
      deepLink?: string;
      imageUrl?: string;
      scheduledTime?: Date;
    }
  ): Promise<string | null> {
    try {
      const notificationId = `notification_${Date.now()}`;
      
      // For web, we can only show notifications immediately
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        // If there's a scheduled time and it's in the future, set a timeout
        if (options?.scheduledTime && options.scheduledTime > new Date()) {
          const delay = options.scheduledTime.getTime() - Date.now();
          setTimeout(() => {
            new Notification(title, {
              body,
              icon: options?.imageUrl,
              data: {
                ...data,
                id: notificationId,
                category: options?.category || NotificationCategory.SYSTEM,
                deepLink: options?.deepLink
              }
            });
          }, delay);
        } else {
          // Show immediately
          new Notification(title, {
            body,
            icon: options?.imageUrl,
            data: {
              ...data,
              id: notificationId,
              category: options?.category || NotificationCategory.SYSTEM,
              deepLink: options?.deepLink
            }
          });
        }
      }
      
      return notificationId;
    } catch (error) {
      console.error('Failed to schedule local notification:', error);
      return null;
    }
  }
  
  /**
   * Get notification preferences
   */
  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }
  
  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<boolean> {
    try {
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
      
      // Save preferences to localStorage for web
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('notification_preferences', JSON.stringify(this.preferences));
      }
      
      return true;
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      return false;
    }
  }
  
  /**
   * Reset notification preferences to default
   */
  async resetPreferences(): Promise<boolean> {
    try {
      this.preferences = { ...DEFAULT_PREFERENCES };
      
      // Save preferences to localStorage for web
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('notification_preferences', JSON.stringify(this.preferences));
      }
      
      return true;
    } catch (error) {
      console.error('Failed to reset notification preferences:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const notificationService = new NotificationService();