/**
 * Onboarding service for web
 * Handles onboarding state and analytics
 */

import { trackEvent, trackOnboardingStarted, trackOnboardingStep, trackOnboardingCompleted } from './analyticsService';

// Configuration options
const BYPASS_ONBOARDING_IN_DEV = false; // Set to true only when needed for testing

// Local storage key for onboarding status with a unique prefix to avoid conflicts
const ONBOARDING_COMPLETED_KEY = 'ai_sports_edge_onboarding_completed';

// Helper function to sanitize values for XSS prevention
const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    return value.replace(/[<>]/g, '');
  }
  return value;
};

/**
 * Check if onboarding has been completed
 * @returns {Promise<boolean>} True if onboarding has been completed
 */
export const isOnboardingCompleted = async () => {
  try {
    // For development purposes, optionally bypass onboarding
    // This makes it easier to test the app without going through onboarding
    const isDevelopment = window.location.hostname === 'localhost' ||
                          window.location.hostname === '127.0.0.1';
    
    if (isDevelopment && BYPASS_ONBOARDING_IN_DEV) {
      console.log('Development mode: Onboarding bypassed');
      return true;
    }
    
    // Use a try-catch block to handle potential localStorage access issues
    // This can happen in private browsing mode or when storage is full
    const completed = localStorage.getItem(ONBOARDING_COMPLETED_KEY);
    
    // Validate the value to prevent unexpected behavior
    if (completed !== 'true' && completed !== null) {
      // Check for potential XSS attempts in the stored value
      if (completed && (completed.includes('<') || completed.includes('>'))) {
        console.warn('Potentially malicious onboarding status value detected:', sanitizeValue(completed));
        // Reset to a valid state and clear the suspicious value
        localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
        localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'false');
        return false;
      }
      
      console.warn('Invalid onboarding status value:', sanitizeValue(completed));
      // Reset to a valid state
      localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'false');
      return false;
    }
    
    return completed === 'true';
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    // Graceful degradation - if we can't access localStorage, assume onboarding is not completed
    return false;
  }
};

/**
 * Mark onboarding as completed
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export const markOnboardingCompleted = async () => {
  try {
    // Check if localStorage is available
    if (typeof localStorage === 'undefined') {
      console.error('localStorage is not available');
      return false;
    }
    
    // Try to use more secure storage if available
    if (window.sessionStorage) {
      try {
        // Store a backup in sessionStorage in case localStorage fails
        sessionStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
      } catch (sessionError) {
        console.warn('Failed to use sessionStorage as backup:', sessionError);
      }
    }
    
    // Set the value with proper error handling
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    
    // Verify the value was set correctly
    const verifyValue = localStorage.getItem(ONBOARDING_COMPLETED_KEY);
    if (verifyValue !== 'true') {
      console.error('Failed to set onboarding status');
      return false;
    }
    
    // Track onboarding completion with analytics
    try {
      await trackOnboardingCompleted();
    } catch (analyticsError) {
      // Don't let analytics errors affect the main functionality
      console.warn('Analytics error:', analyticsError);
    }
    
    return true;
  } catch (error) {
    console.error('Error marking onboarding as completed:', error);
    
    // Try to use the backup from sessionStorage if localStorage failed
    if (window.sessionStorage) {
      try {
        const backupValue = sessionStorage.getItem(ONBOARDING_COMPLETED_KEY);
        if (backupValue === 'true') {
          console.log('Using sessionStorage backup for onboarding status');
          return true;
        }
      } catch (sessionError) {
        console.warn('Failed to read from sessionStorage backup:', sessionError);
      }
    }
    
    // Return false instead of throwing to prevent app crashes
    return false;
  }
};

/**
 * Reset onboarding status (for testing)
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export const resetOnboardingStatus = async () => {
  try {
    // Remove from localStorage
    localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
    
    // Also remove from sessionStorage if it exists
    if (window.sessionStorage) {
      try {
        sessionStorage.removeItem(ONBOARDING_COMPLETED_KEY);
      } catch (sessionError) {
        console.warn('Failed to remove from sessionStorage:', sessionError);
      }
    }
    
    // Verify removal
    const verifyValue = localStorage.getItem(ONBOARDING_COMPLETED_KEY);
    if (verifyValue !== null) {
      console.error('Failed to reset onboarding status');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error resetting onboarding status:', error);
    return false;
  }
};

/**
 * Initialize onboarding analytics
 * @param {number} totalSteps - Total number of onboarding steps
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
export const initOnboardingAnalytics = async (totalSteps) => {
  try {
    // Input validation
    if (!Number.isInteger(totalSteps) || totalSteps <= 0 || totalSteps > 100) {
      console.error('Invalid totalSteps value:', totalSteps);
      return false;
    }
    
    // Track onboarding started event using the new analytics service
    await trackOnboardingStarted(totalSteps);
    
    return true;
  } catch (error) {
    console.error('Error initializing onboarding analytics:', error);
    return false;
  }
};

/**
 * Update onboarding progress
 * @param {number} currentStep - Current step index (1-based)
 * @param {number} totalSteps - Total number of steps
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
export const updateOnboardingProgress = async (currentStep, totalSteps) => {
  try {
    // Input validation
    if (!Number.isInteger(currentStep) || currentStep <= 0 || currentStep > 100) {
      console.error('Invalid currentStep value:', currentStep);
      return false;
    }
    
    if (!Number.isInteger(totalSteps) || totalSteps <= 0 || totalSteps > 100) {
      console.error('Invalid totalSteps value:', totalSteps);
      return false;
    }
    
    if (currentStep > totalSteps) {
      console.error('currentStep cannot be greater than totalSteps');
      return false;
    }
    
    // Track onboarding step event using the new analytics service
    await trackOnboardingStep(currentStep, totalSteps);
    return true;
  } catch (error) {
    console.error('Error updating onboarding progress:', error);
    return false;
  }
};