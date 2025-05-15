import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { auth } from '../config/firebase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Notification types
export interface NotificationPreferences {
  enabled: boolean;
  betAlerts: boolean;
  gameStartAlerts: boolean;
  promotionalAlerts: boolean;
  dailyInsights: boolean;
}

// Default notification preferences
const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  betAlerts: true,
  gameStartAlerts: true,
  promotionalAlerts: false,
  dailyInsights: true,
};

/**
 * Get notification preferences for the current user
 * @returns Notification preferences
 */
export const getNotificationPreferences = async (): Promise<NotificationPreferences> => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      return DEFAULT_PREFERENCES;
    }

    const prefsString = await AsyncStorage.getItem(`notifications_${userId}`);
    if (!prefsString) {
      return DEFAULT_PREFERENCES;
    }

    return JSON.parse(prefsString) as NotificationPreferences;
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return DEFAULT_PREFERENCES;
  }
};

/**
 * Save notification preferences for the current user
 * @param preferences Notification preferences
 * @returns Success status
 */
export const saveNotificationPreferences = async (
  preferences: Partial<NotificationPreferences>
): Promise<boolean> => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      return false;
    }

    const currentPrefs = await getNotificationPreferences();
    const updatedPrefs = { ...currentPrefs, ...preferences };

    await AsyncStorage.setItem(
      `notifications_${userId}`,
      JSON.stringify(updatedPrefs)
    );

    return true;
  } catch (error) {
    console.error('Error saving notification preferences:', error);
    return false;
  }
};

/**
 * Request notification permissions
 * @returns Permission status
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Only ask if permissions have not already been determined
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // Save the enabled status based on permissions
    if (finalStatus === 'granted') {
      await saveNotificationPreferences({ enabled: true });
      return true;
    } else {
      await saveNotificationPreferences({ enabled: false });
      return false;
    }
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

/**
 * Schedule a local notification
 * @param title Notification title
 * @param body Notification body
 * @param data Additional data
 * @param trigger Notification trigger
 * @returns Notification ID
 */
export const scheduleNotification = async (
  title: string,
  body: string,
  data: any = {},
  trigger: Notifications.NotificationTriggerInput = null
): Promise<string> => {
  try {
    const prefs = await getNotificationPreferences();
    if (!prefs.enabled) {
      return '';
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger,
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return '';
  }
};

/**
 * Schedule a bet alert notification
 * @param gameTitle Game title
 * @param betInfo Bet information
 * @param scheduledTime Scheduled time
 * @returns Notification ID
 */
export const scheduleBetAlert = async (
  gameTitle: string,
  betInfo: string,
  scheduledTime: Date
): Promise<string> => {
  try {
    const prefs = await getNotificationPreferences();
    if (!prefs.enabled || !prefs.betAlerts) {
      return '';
    }

    return await scheduleNotification(
      `Betting Opportunity: ${gameTitle}`,
      betInfo,
      { type: 'bet_alert', gameTitle },
      { date: scheduledTime }
    );
  } catch (error) {
    console.error('Error scheduling bet alert:', error);
    return '';
  }
};

/**
 * Schedule a game start notification
 * @param gameTitle Game title
 * @param startTime Game start time
 * @returns Notification ID
 */
export const scheduleGameStartAlert = async (
  gameTitle: string,
  startTime: Date
): Promise<string> => {
  try {
    const prefs = await getNotificationPreferences();
    if (!prefs.enabled || !prefs.gameStartAlerts) {
      return '';
    }

    // Schedule 15 minutes before game start
    const notificationTime = new Date(startTime.getTime() - 15 * 60 * 1000);

    return await scheduleNotification(
      `Game Starting Soon: ${gameTitle}`,
      `${gameTitle} is starting in 15 minutes. Don't miss it!`,
      { type: 'game_start', gameTitle },
      { date: notificationTime }
    );
  } catch (error) {
    console.error('Error scheduling game start alert:', error);
    return '';
  }
};

/**
 * Schedule a daily insights notification
 * @returns Notification ID
 */
export const scheduleDailyInsightsNotification = async (): Promise<string> => {
  try {
    const prefs = await getNotificationPreferences();
    if (!prefs.enabled || !prefs.dailyInsights) {
      return '';
    }

    // Schedule for 9 AM tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    return await scheduleNotification(
      'Daily Betting Insights',
      'Your daily AI betting insights are ready. Check them out!',
      { type: 'daily_insights' },
      { date: tomorrow }
    );
  } catch (error) {
    console.error('Error scheduling daily insights notification:', error);
    return '';
  }
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllNotifications = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling notifications:', error);
  }
};

export default {
  getNotificationPreferences,
  saveNotificationPreferences,
  requestNotificationPermissions,
  scheduleNotification,
  scheduleBetAlert,
  scheduleGameStartAlert,
  scheduleDailyInsightsNotification,
  cancelAllNotifications,
};