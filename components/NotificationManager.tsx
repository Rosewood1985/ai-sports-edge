import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import { analyticsService } from '../services/analyticsService';
import notificationService from '../services/notificationService';
import deepLinkingService from '../services/deepLinkingService';
import RichNotification from './RichNotification';

/**
 * In-app notification
 */
interface InAppNotification {
  id: string;
  title: string;
  body: string;
  category: string;
  imageUrl?: string;
  deepLink?: string;
  data?: Record<string, any>;
  timestamp: number;
}

/**
 * Props for the NotificationManager component
 */
interface NotificationManagerProps {
  /**
   * Children components
   */
  children: React.ReactNode;
  
  /**
   * Maximum number of notifications to keep in history
   * @default 50
   */
  maxHistorySize?: number;
  
  /**
   * Whether to show notifications when app is in foreground
   * @default true
   */
  showInForeground?: boolean;
  
  /**
   * Auto hide duration in milliseconds
   * @default 5000
   */
  autoHideDuration?: number;
}

/**
 * Component to manage and display in-app notifications
 */
const NotificationManager: React.FC<NotificationManagerProps> = ({
  children,
  maxHistorySize = 50,
  showInForeground = true,
  autoHideDuration = 5000
}) => {
  const [activeNotification, setActiveNotification] = useState<InAppNotification | null>(null);
  const [notificationHistory, setNotificationHistory] = useState<InAppNotification[]>([]);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();
  
  // Initialize notification listeners
  useEffect(() => {
    // Initialize notification service
    notificationService.initialize();
    
    // Set up notification received listener
    notificationListener.current = Notifications.addNotificationReceivedListener(
      handleNotificationReceived
    );
    
    // Set up notification response listener
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );
    
    // Set up app state change listener
    const appStateListener = AppState.addEventListener('change', handleAppStateChange);
    
    // Clean up on unmount
    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
      appStateListener.remove();
    };
  }, []);
  
  /**
   * Handle app state change
   * @param nextAppState Next app state
   */
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    // If app comes to foreground, clear active notification
    if (appState.match(/inactive|background/) && nextAppState === 'active') {
      setActiveNotification(null);
    }
    
    setAppState(nextAppState);
  };
  
  /**
   * Handle notification received
   * @param notification Notification
   */
  const handleNotificationReceived = (notification: Notifications.Notification) => {
    try {
      // Extract notification data
      const { title, body } = notification.request.content;
      const data = notification.request.content.data as Record<string, any>;
      
      // Create in-app notification
      const inAppNotification: InAppNotification = {
        id: notification.request.identifier,
        title: title || 'New Notification',
        body: body || '',
        category: data.category || 'system',
        imageUrl: data.imageUrl,
        deepLink: data.deepLink,
        data,
        timestamp: Date.now()
      };
      
      // Add to history
      addToHistory(inAppNotification);
      
      // Show notification if app is in foreground
      if (showInForeground && appState === 'active') {
        setActiveNotification(inAppNotification);
      }
      
      // Track event
      analyticsService.trackEvent('in_app_notification_received', {
        id: inAppNotification.id,
        category: inAppNotification.category
      });
    } catch (error) {
      console.error('Error handling notification received:', error);
    }
  };
  
  /**
   * Handle notification response
   * @param response Notification response
   */
  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    try {
      // Extract notification data
      const { notification } = response;
      const { title, body } = notification.request.content;
      const data = notification.request.content.data as Record<string, any>;
      
      // Create in-app notification
      const inAppNotification: InAppNotification = {
        id: notification.request.identifier,
        title: title || 'New Notification',
        body: body || '',
        category: data.category || 'system',
        imageUrl: data.imageUrl,
        deepLink: data.deepLink,
        data,
        timestamp: Date.now()
      };
      
      // Add to history
      addToHistory(inAppNotification);
      
      // Handle notification press
      handleNotificationPress(
        inAppNotification.id,
        inAppNotification.deepLink,
        inAppNotification.data
      );
      
      // Track event
      analyticsService.trackEvent('notification_opened', {
        id: inAppNotification.id,
        category: inAppNotification.category
      });
    } catch (error) {
      console.error('Error handling notification response:', error);
    }
  };
  
  /**
   * Add notification to history
   * @param notification Notification to add
   */
  const addToHistory = (notification: InAppNotification) => {
    setNotificationHistory(prevHistory => {
      // Add new notification to beginning of history
      const newHistory = [notification, ...prevHistory];
      
      // Limit history size
      if (newHistory.length > maxHistorySize) {
        return newHistory.slice(0, maxHistorySize);
      }
      
      return newHistory;
    });
  };
  
  /**
   * Handle notification close
   * @param id Notification ID
   */
  const handleNotificationClose = (id: string) => {
    setActiveNotification(null);
    
    // Track event
    analyticsService.trackEvent('in_app_notification_dismissed', {
      id
    });
  };
  
  /**
   * Handle notification press
   * @param id Notification ID
   * @param deepLink Deep link URL
   * @param data Additional data
   */
  const handleNotificationPress = (
    id: string,
    deepLink?: string,
    data?: Record<string, any>
  ) => {
    // Clear active notification
    setActiveNotification(null);
    
    // Open deep link if provided
    if (deepLink) {
      deepLinkingService.openDeepLink(deepLink);
    }
    
    // Track event
    analyticsService.trackEvent('in_app_notification_pressed', {
      id,
      hasDeepLink: !!deepLink
    });
  };
  
  /**
   * Show a notification
   * @param notification Notification to show
   */
  const showNotification = (notification: Omit<InAppNotification, 'id' | 'timestamp'>) => {
    // Create notification with ID and timestamp
    const inAppNotification: InAppNotification = {
      ...notification,
      id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    
    // Add to history
    addToHistory(inAppNotification);
    
    // Show notification
    setActiveNotification(inAppNotification);
    
    // Track event
    analyticsService.trackEvent('manual_notification_shown', {
      id: inAppNotification.id,
      category: inAppNotification.category
    });
    
    return inAppNotification.id;
  };
  
  /**
   * Get notification history
   * @returns Notification history
   */
  const getNotificationHistory = () => {
    return [...notificationHistory];
  };
  
  /**
   * Clear notification history
   */
  const clearNotificationHistory = () => {
    setNotificationHistory([]);
    
    // Track event
    analyticsService.trackEvent('notification_history_cleared');
  };
  
  // Expose methods to children
  const notificationManager = {
    showNotification,
    getNotificationHistory,
    clearNotificationHistory
  };
  
  return (
    <View style={styles.container}>
      {children}
      
      {activeNotification && (
        <RichNotification
          id={activeNotification.id}
          title={activeNotification.title}
          body={activeNotification.body}
          category={activeNotification.category}
          imageUrl={activeNotification.imageUrl}
          deepLink={activeNotification.deepLink}
          data={activeNotification.data}
          autoHideDuration={autoHideDuration}
          onClose={handleNotificationClose}
          onPress={handleNotificationPress}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default NotificationManager;

// Create context for notification manager
import { createContext, useContext } from 'react';

interface NotificationManagerContextValue {
  showNotification: (notification: Omit<InAppNotification, 'id' | 'timestamp'>) => string;
  getNotificationHistory: () => InAppNotification[];
  clearNotificationHistory: () => void;
}

export const NotificationManagerContext = createContext<NotificationManagerContextValue | null>(null);

/**
 * Hook to use notification manager
 * @returns Notification manager
 */
export const useNotificationManager = () => {
  const context = useContext(NotificationManagerContext);
  
  if (!context) {
    throw new Error('useNotificationManager must be used within a NotificationManager');
  }
  
  return context;
};