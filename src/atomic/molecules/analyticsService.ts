/**
 * Analytics Service Molecule
 * 
 * Provides cross-platform analytics functionality
 * Handles tracking events, user properties, and standardized event names
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseAnalytics, firebaseFirestore, firebaseAuth } from './index';
import { doc, setDoc, Timestamp } from 'firebase/firestore';

// Sanitize values for XSS prevention
const sanitizeValue = (value: any): any => {
  if (typeof value === 'string') {
    // More comprehensive XSS prevention
    // Escape HTML special chars, script tags, event handlers, and data URIs
    return value
      .replace(/[&<>"']/g, (char) => {
        const entities: Record<string, string> = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        };
        return entities[char];
      })
      .replace(/javascript:/gi, 'blocked:')
      .replace(/on\w+=/gi, 'data-blocked=')
      .replace(/data:(?!image\/(jpeg|png|gif|webp))/gi, 'blocked:');
  }
  if (typeof value === 'object' && value !== null) {
    // Handle arrays
    if (Array.isArray(value)) {
      return value.map(item => sanitizeValue(item));
    }
    // Handle objects
    return Object.keys(value).reduce((acc: Record<string, any>, key) => {
      acc[key] = sanitizeValue(value[key]);
      return acc;
    }, {});
  }
  return value;
};

/**
 * Track an analytics event
 * @param {string} eventName - Name of the event to track
 * @param {Object} eventData - Data associated with the event
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
const trackEvent = async (eventName: string, eventData: Record<string, any>): Promise<boolean> => {
  try {
    // Sanitize inputs
    const sanitizedEventName = sanitizeValue(eventName);
    const sanitizedEventData = sanitizeValue(eventData);
    
    // Add common properties
    const commonData = {
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
    };
    
    // Merge with event data
    const fullEventData = {
      ...sanitizedEventData,
      ...commonData
    };
    
    // Web implementation (gtag)
    if (Platform.OS === 'web' && typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', sanitizedEventName, fullEventData);
    }
    
    // React Native implementation (Firebase)
    if (Platform.OS !== 'web') {
      // Use Firebase Analytics
      firebaseAnalytics.logAnalyticsEvent(sanitizedEventName, fullEventData);
      
      // Store in Firestore if user is logged in
      const auth = firebaseAuth.auth;
      if (auth && auth.currentUser) {
        const userId = auth.currentUser.uid;
        const deviceId = await getDeviceId();
        
        const analyticsRef = doc(
          firebaseFirestore.firestore,
          'analytics_events',
          `${userId || deviceId}_${sanitizedEventName}_${Date.now()}`
        );
        
        await setDoc(analyticsRef, {
          eventName: sanitizedEventName,
          userId: userId || null,
          deviceId: deviceId,
          ...fullEventData,
          serverTimestamp: Timestamp.now()
        });
      }
    }
    
    return true;
  } catch (error) {
    console.error('Analytics error:', error);
    // Don't let analytics errors affect the main functionality
    return false;
  }
};

/**
 * Get a unique device ID
 * @returns {Promise<string>} - Device ID
 */
const getDeviceId = async (): Promise<string> => {
  try {
    // For React Native
    if (Platform.OS !== 'web') {
      let deviceId = await AsyncStorage.getItem('@AISportsEdge:deviceId');
      
      if (!deviceId) {
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        await AsyncStorage.setItem('@AISportsEdge:deviceId', deviceId);
      }
      
      return deviceId;
    }
    
    // For Web
    if (typeof localStorage !== 'undefined') {
      let deviceId = localStorage.getItem('ai_sports_edge_device_id');
      
      if (!deviceId) {
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem('ai_sports_edge_device_id', deviceId);
      }
      
      return deviceId;
    }
    
    // Fallback
    return `anonymous_${Date.now()}`;
  } catch (error) {
    console.error('Error getting device ID:', error);
    return `anonymous_${Date.now()}`;
  }
};

/**
 * Track onboarding started event
 * @param {number} totalSteps - Total number of onboarding steps
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
const trackOnboardingStarted = async (totalSteps: number): Promise<boolean> => {
  return trackEvent('onboarding_started', {
    event_category: 'engagement',
    event_label: 'onboarding',
    total_steps: totalSteps
  });
};

/**
 * Track onboarding step viewed event
 * @param {number} currentStep - Current step index (1-based)
 * @param {number} totalSteps - Total number of steps
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
const trackOnboardingStep = async (currentStep: number, totalSteps: number): Promise<boolean> => {
  const progressPercentage = Math.round((currentStep / totalSteps) * 100);
  
  return trackEvent('onboarding_step', {
    event_category: 'engagement',
    event_label: `step_${currentStep}`,
    current_step: currentStep,
    total_steps: totalSteps,
    progress_percentage: progressPercentage
  });
};

/**
 * Track onboarding completed event
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
const trackOnboardingCompleted = async (): Promise<boolean> => {
  return trackEvent('onboarding_completed', {
    event_category: 'engagement',
    event_label: 'onboarding'
  });
};

// Define standard event types
export type AnalyticsEventType = 
  // Microtransaction events
  | 'microtransaction_interaction'
  | 'microtransaction_impression'
  | 'microtransaction_click'
  | 'microtransaction_purchase'
  | 'microtransaction_purchase_attempt'
  | 'microtransaction_purchase_success'
  | 'microtransaction_purchase_failed'
  | 'microtransaction_purchase_error'
  | 'microtransaction_conversion'
  
  // UI events
  | 'upgrade_prompt_displayed'
  | 'navigate_to_subscription'
  
  // Subscription events
  | 'subscription_view'
  | 'subscription_select'
  | 'subscription_purchase_attempt'
  | 'subscription_purchase_success'
  | 'subscription_purchase_failed'
  | 'subscription_cancel'
  | 'subscription_change'
  
  // User events
  | 'user_login'
  | 'user_signup'
  | 'user_logout'
  | 'user_profile_update'
  
  // Feature usage events
  | 'feature_view'
  | 'feature_use'
  | 'odds_purchase_initiated'
  | 'odds_purchase_completed'
  | 'odds_purchase_cancelled'
  | 'odds_purchase_error'
  | 'purchase_advanced_metrics'
  | 'purchase_player_comparison'
  | 'purchase_historical_trends'
  | 'purchase_premium_bundle'
  
  // App lifecycle events
  | 'app_open'
  | 'app_close'
  | 'app_crash'
  | 'app_update'
  
  // Navigation events
  | 'screen_view'
  | 'tab_change'
  | 'deep_link_open'
  
  // Performance events
  | 'api_request'
  | 'api_response'
  | 'api_error'
  | 'app_load_time'
  | 'screen_load_time';

// Define the analytics service interface
export interface AnalyticsService {
  /**
   * Track an analytics event
   * @param eventType Type of event to track
   * @param eventParams Additional parameters for the event
   * @returns Promise that resolves when the event is tracked
   */
  trackEvent(eventType: AnalyticsEventType, eventParams?: Record<string, any>): Promise<boolean>;
  
  /**
   * Set user properties for analytics
   * @param userId User ID
   * @param properties User properties to set
   * @returns Promise that resolves when the properties are set
   */
  setUserProperties(userId: string, properties: Record<string, any>): Promise<void>;
  
  /**
   * Track onboarding started event
   * @param totalSteps Total number of onboarding steps
   * @returns Promise that resolves when the event is tracked
   */
  trackOnboardingStarted(totalSteps: number): Promise<boolean>;
  
  /**
   * Track onboarding step viewed event
   * @param currentStep Current step index (1-based)
   * @param totalSteps Total number of steps
   * @returns Promise that resolves when the event is tracked
   */
  trackOnboardingStep(currentStep: number, totalSteps: number): Promise<boolean>;
  
  /**
   * Track onboarding completed event
   * @returns Promise that resolves when the event is tracked
   */
  trackOnboardingCompleted(): Promise<boolean>;
}

/**
 * Set user properties for analytics
 * @param userId User ID
 * @param properties User properties to set
 * @returns Promise that resolves when the properties are set
 */
const setUserProperties = async (userId: string, properties: Record<string, any>): Promise<void> => {
  try {
    // Sanitize properties
    const sanitizedProperties = sanitizeValue(properties);
    
    // Set user properties in Firebase Analytics
    firebaseAnalytics.setUserAnalyticsProperties(sanitizedProperties);
    
    // Store in Firestore
    const userPropertiesRef = doc(firebaseFirestore.firestore, 'user_properties', userId);
    await setDoc(userPropertiesRef, {
      ...sanitizedProperties,
      lastUpdated: Timestamp.now()
    }, { merge: true });
  } catch (error) {
    console.error('Error setting user properties:', error);
  }
};

// Export the analytics service
export {
  trackEvent,
  setUserProperties,
  trackOnboardingStarted,
  trackOnboardingStep,
  trackOnboardingCompleted,
  getDeviceId
};