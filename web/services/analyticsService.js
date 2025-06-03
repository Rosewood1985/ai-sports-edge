/**
 * Analytics Service for Web
 *
 * A unified analytics interface for the web platform
 * This service abstracts away the platform-specific implementation details
 * and provides a consistent API for tracking events.
 */

// Helper function to sanitize values for XSS prevention
const sanitizeValue = value => {
  if (typeof value === 'string') {
    return value.replace(/[<>]/g, '');
  }
  if (typeof value === 'object' && value !== null) {
    return Object.keys(value).reduce((acc, key) => {
      acc[key] = sanitizeValue(value[key]);
      return acc;
    }, {});
  }
  return value;
};

/**
 * Get a unique device ID
 * @returns {Promise<string>} - Device ID
 */
const getDeviceId = async () => {
  try {
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
 * Track an analytics event
 * @param {string} eventName - Name of the event to track
 * @param {Object} eventData - Data associated with the event
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
export const trackEvent = async (eventName, eventData) => {
  try {
    // Sanitize inputs
    const sanitizedEventName = sanitizeValue(eventName);
    const sanitizedEventData = sanitizeValue(eventData);

    // Add common properties
    const commonData = {
      timestamp: new Date().toISOString(),
      platform: 'web',
      browser: navigator.userAgent ? sanitizeValue(navigator.userAgent) : 'unknown',
      language: navigator.language || 'en',
      url: window.location.href,
      referrer: document.referrer || 'direct',
    };

    // Merge with event data
    const fullEventData = {
      ...sanitizedEventData,
      ...commonData,
    };

    // Web implementation (gtag)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', sanitizedEventName, fullEventData);
    }

    // Log to console in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', sanitizedEventName, fullEventData);
    }

    return true;
  } catch (error) {
    console.error('Analytics error:', error);
    // Don't let analytics errors affect the main functionality
    return false;
  }
};

/**
 * Track onboarding started event
 * @param {number} totalSteps - Total number of onboarding steps
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
export const trackOnboardingStarted = async totalSteps => {
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
export const trackOnboardingStep = async (currentStep, totalSteps) => {
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
export const trackOnboardingCompleted = async () => {
  return trackEvent('onboarding_completed', {
    event_category: 'engagement',
    event_label: 'onboarding',
  });
};
