/**
 * Analytics Service
 *
 * A unified analytics interface that works across platforms (web and mobile)
 * This service abstracts away the platform-specific implementation details
 * and provides a consistent API for tracking events.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { Platform } from 'react-native';

import { firestore, auth } from '../config/firebase';

// Sanitize values for XSS prevention
const sanitizeValue = (value: any): any => {
  if (typeof value === 'string') {
    // More comprehensive XSS prevention
    // Escape HTML special chars, script tags, event handlers, and data URIs
    return value
      .replace(/[&<>"']/g, char => {
        const entities: Record<string, string> = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
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
export const trackEvent = async (
  eventName: string,
  eventData: Record<string, any>
): Promise<boolean> => {
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
      ...commonData,
    };

    // Web implementation (gtag)
    if (Platform.OS === 'web' && typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', sanitizedEventName, fullEventData);
    }

    // React Native implementation (Firebase)
    if (Platform.OS !== 'web') {
      // Store in Firestore if user is logged in
      if (auth.currentUser) {
        const userId = auth.currentUser.uid;
        const deviceId = await getDeviceId();

        const analyticsRef = doc(
          firestore,
          'analytics_events',
          `${userId || deviceId}_${sanitizedEventName}_${Date.now()}`
        );

        await setDoc(analyticsRef, {
          eventName: sanitizedEventName,
          userId: userId || null,
          deviceId,
          ...fullEventData,
          serverTimestamp: Timestamp.now(),
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
export const trackOnboardingStarted = async (totalSteps: number): Promise<boolean> => {
  return trackEvent('onboarding_started', {
    event_category: 'engagement',
    event_label: 'onboarding',
    total_steps: totalSteps,
  });
};

/**
 * Track onboarding step viewed event
 * @param {number} currentStep - Current step index (1-based)
 * @param {number} totalSteps - Total number of steps
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
export const trackOnboardingStep = async (
  currentStep: number,
  totalSteps: number
): Promise<boolean> => {
  const progressPercentage = Math.round((currentStep / totalSteps) * 100);

  return trackEvent('onboarding_step', {
    event_category: 'engagement',
    event_label: `step_${currentStep}`,
    current_step: currentStep,
    total_steps: totalSteps,
    progress_percentage: progressPercentage,
  });
};

/**
 * Track onboarding completed event
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
export const trackOnboardingCompleted = async (): Promise<boolean> => {
  return trackEvent('onboarding_completed', {
    event_category: 'engagement',
    event_label: 'onboarding',
  });
};
